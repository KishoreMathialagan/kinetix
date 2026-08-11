import pytest
from httpx import AsyncClient

ADMIN_EMAIL = "admin@kinetix.com"
ADMIN_PASSWORD = "Admin@123"


async def _admin_headers(async_client: AsyncClient) -> dict:
    response = await async_client.post(
        "/api/v1/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def _register_patient(async_client: AsyncClient, email: str) -> dict:
    response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Comm",
            "last_name": "Patient",
            "email": email,
            "password": "Password123!",
            "gender": "female",
        },
    )
    assert response.status_code == 201, response.text
    login = await async_client.post(
        "/api/v1/auth/login", json={"email": email, "password": "Password123!"}
    )
    assert login.status_code == 200, login.text
    head = {"Authorization": f"Bearer {login.json()['access_token']}"}
    me = await async_client.get("/api/v1/auth/me", headers=head)
    assert me.status_code == 200, me.text
    return {"user_id": response.json()["user_id"], "patient_id": me.json()["patient_id"]}


async def _create_therapist(async_client: AsyncClient, head: dict, email: str) -> dict:
    response = await async_client.post(
        "/api/v1/therapists",
        headers=head,
        json={
            "first_name": "Feed",
            "last_name": "Therapist",
            "email": email,
            "password": "Password123!",
            "phone": "5553001",
            "license_number": f"LICF-{email.split('@')[0]}",
            "registration_number": f"REGF-{email.split('@')[0]}",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_notifications_flow(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "notif@test.com")

    created = await async_client.post(
        "/api/v1/notifications",
        headers=admin_head,
        json={
            "user_id": patient["user_id"],
            "title": "Welcome",
            "body": "Your account is ready.",
        },
    )
    assert created.status_code == 201, created.text
    notif_id = created.json()["id"]

    login = await async_client.post(
        "/api/v1/auth/login", json={"email": "notif@test.com", "password": "Password123!"}
    )
    patient_head = {"Authorization": f"Bearer {login.json()['access_token']}"}

    unread = await async_client.get("/api/v1/notifications?unread_only=true", headers=patient_head)
    assert unread.status_code == 200
    assert unread.json()["total"] == 1

    count = await async_client.get("/api/v1/notifications/unread-count", headers=patient_head)
    assert count.status_code == 200
    assert count.json()["count"] == 1

    marked = await async_client.patch(f"/api/v1/notifications/{notif_id}/read", headers=patient_head)
    assert marked.status_code == 200
    assert marked.json()["read_at"] is not None

    count2 = await async_client.get("/api/v1/notifications/unread-count", headers=patient_head)
    assert count2.json()["count"] == 0

    created2 = await async_client.post(
        "/api/v1/notifications",
        headers=admin_head,
        json={"user_id": patient["user_id"], "title": "Reminder", "body": "Appointment tomorrow."},
    )
    assert created2.status_code == 201
    all_read = await async_client.patch("/api/v1/notifications/read-all", headers=patient_head)
    assert all_read.status_code == 200
    assert all_read.json()["updated"] == 1

    deleted = await async_client.delete(f"/api/v1/notifications/{notif_id}", headers=patient_head)
    assert deleted.status_code == 204

    # Patient cannot create notifications for others
    denied = await async_client.post(
        "/api/v1/notifications",
        headers=patient_head,
        json={"user_id": patient["user_id"], "title": "x", "body": "y"},
    )
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_feedback_flow(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "fdbk@test.com")
    therapist = await _create_therapist(async_client, admin_head, "fdbkther@test.com")

    login = await async_client.post(
        "/api/v1/auth/login", json={"email": "fdbk@test.com", "password": "Password123!"}
    )
    patient_head = {"Authorization": f"Bearer {login.json()['access_token']}"}

    submitted = await async_client.post(
        "/api/v1/feedback",
        headers=patient_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist["id"],
            "rating": 5,
            "communication": 4,
            "professionalism": 5,
            "treatment_quality": 5,
            "comments": "Great care",
        },
    )
    assert submitted.status_code == 201, submitted.text
    assert submitted.json()["rating"] == 5

    listing = await async_client.get("/api/v1/feedback", headers=admin_head)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    by_therapist = await async_client.get(
        f"/api/v1/feedback/therapist/{therapist['id']}", headers=admin_head
    )
    assert by_therapist.status_code == 200
    assert by_therapist.json()["total"] == 1

    by_patient = await async_client.get(
        f"/api/v1/feedback?patient_id={patient['patient_id']}", headers=admin_head
    )
    assert by_patient.status_code == 200
    assert by_patient.json()["total"] == 1

    invalid = await async_client.post(
        "/api/v1/feedback",
        headers=patient_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist["id"],
            "rating": 9,
        },
    )
    assert invalid.status_code == 422


@pytest.mark.asyncio
async def test_global_search(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    await _register_patient(async_client, "findme@test.com")
    await _create_therapist(async_client, admin_head, "findher@test.com")

    results = await async_client.get("/api/v1/search?q=find", headers=admin_head)
    assert results.status_code == 200, results.text
    body = results.json()
    assert body["patients"]
    assert body["therapists"]
    assert all(p["email"] == "findme@test.com" for p in body["patients"])
    assert all(t["email"] == "findher@test.com" for t in body["therapists"])

    empty = await async_client.get("/api/v1/search?q=", headers=admin_head)
    assert empty.status_code == 400

    no_match = await async_client.get("/api/v1/search?q=zzzznothing", headers=admin_head)
    assert no_match.status_code == 200
    assert no_match.json()["patients"] == []
