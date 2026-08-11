
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
            "first_name": "Rec",
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
            "first_name": "Rec",
            "last_name": "Therapist",
            "email": email,
            "password": "Password123!",
            "phone": "5555001",
            "license_number": f"LICR-{email.split('@')[0]}",
            "registration_number": f"REGR-{email.split('@')[0]}",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_patients_crud(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "reccrud@test.com")

    listing = await async_client.get("/api/v1/patients", headers=admin_head)
    assert listing.status_code == 200, listing.text
    assert listing.json()["total"] == 1

    fetched = await async_client.get(f"/api/v1/patients/{patient['patient_id']}", headers=admin_head)
    assert fetched.status_code == 200
    assert fetched.json()["patient_code"]

    updated = await async_client.put(
        f"/api/v1/patients/{patient['patient_id']}",
        headers=admin_head,
        json={"diagnosis": "Knee osteoarthritis", "occupation": "Teacher"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["diagnosis"] == "Knee osteoarthritis"

    archived = await async_client.patch(
        f"/api/v1/patients/{patient['patient_id']}/archive", headers=admin_head
    )
    assert archived.status_code == 200

    restored = await async_client.patch(
        f"/api/v1/patients/{patient['patient_id']}/restore", headers=admin_head
    )
    assert restored.status_code == 200
    assert restored.json()["patient_code"] == fetched.json()["patient_code"]


@pytest.mark.asyncio
async def test_therapists_crud_and_availability(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    therapist = await _create_therapist(async_client, admin_head, "recther@test.com")

    listing = await async_client.get("/api/v1/therapists", headers=admin_head)
    assert listing.status_code == 200, listing.text
    assert listing.json()["total"] == 1

    fetched = await async_client.get(f"/api/v1/therapists/{therapist['id']}", headers=admin_head)
    assert fetched.status_code == 200
    assert fetched.json()["license_number"]

    updated = await async_client.put(
        f"/api/v1/therapists/{therapist['id']}",
        headers=admin_head,
        json={"specialization": "Sports Injury"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["specialization"] == "Sports Injury"

    created_avail = await async_client.post(
        f"/api/v1/therapists/{therapist['id']}/availability",
        headers=admin_head,
        json={"weekday": 1, "start_time": "09:00:00", "end_time": "13:00:00"},
    )
    assert created_avail.status_code == 201, created_avail.text
    avail_id = created_avail.json()["id"]

    avail_list = await async_client.get(
        f"/api/v1/therapists/{therapist['id']}/availability", headers=admin_head
    )
    assert avail_list.status_code == 200
    assert len(avail_list.json()) == 6  # 5 seeded defaults + 1 custom

    updated_avail = await async_client.put(
        f"/api/v1/therapists/{therapist['id']}/availability?availability_id={avail_id}",
        headers=admin_head,
        json={"weekday": 2, "start_time": "10:00:00", "end_time": "14:00:00"},
    )
    assert updated_avail.status_code == 200, updated_avail.text
    assert updated_avail.json()["weekday"] == 2


@pytest.mark.asyncio
async def test_appointments_complete_and_typed_assessments(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "recappt@test.com")
    therapist = await _create_therapist(async_client, admin_head, "recapptther@test.com")

    login = await async_client.post(
        "/api/v1/auth/login", json={"email": "recappt@test.com", "password": "Password123!"}
    )
    patient_head = {"Authorization": f"Bearer {login.json()['access_token']}"}

    appointment = await async_client.post(
        "/api/v1/appointments",
        headers=patient_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist["id"],
            "scheduled_date": "2026-08-12",
            "start_time": "10:00:00",
            "duration_minutes": 60,
            "appointment_type": "physiotherapy",
        },
    )
    assert appointment.status_code == 201, appointment.text
    appointment_id = appointment.json()["id"]

    confirmed = await async_client.patch(
        f"/api/v1/appointments/{appointment_id}",
        headers=admin_head,
        json={"status": "confirmed"},
    )
    assert confirmed.status_code == 200, confirmed.text

    in_progress = await async_client.patch(
        f"/api/v1/appointments/{appointment_id}",
        headers=admin_head,
        json={"status": "in_progress"},
    )
    assert in_progress.status_code == 200, in_progress.text

    completed = await async_client.patch(
        f"/api/v1/appointments/{appointment_id}/complete", headers=admin_head
    )
    assert completed.status_code == 200, completed.text
    assert completed.json()["status"] == "completed"

    for endpoint, expected_type in [("initial", "initial"), ("weekly", "weekly"), ("final", "final")]:
        assessment = await async_client.post(
            f"/api/v1/assessments/{endpoint}",
            headers=admin_head,
            json={
                "patient_id": patient["patient_id"],
                "therapist_id": therapist["id"],
                "appointment_id": appointment_id,
                "pain_score": 4,
            },
        )
        assert assessment.status_code == 201, assessment.text
        assert assessment.json()["assessment_type"] == expected_type


@pytest.mark.asyncio
async def test_users_get_delete_and_admin(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "recuser@test.com")

    fetched = await async_client.get(f"/api/v1/users/{patient['user_id']}", headers=admin_head)
    assert fetched.status_code == 200
    assert fetched.json()["email"] == "recuser@test.com"

    deleted = await async_client.delete(f"/api/v1/users/{patient['user_id']}", headers=admin_head)
    assert deleted.status_code == 204

    stats = await async_client.get("/api/v1/admin/statistics", headers=admin_head)
    assert stats.status_code == 200, stats.text
    assert stats.json()["total_patients"] == 1

    logs = await async_client.get("/api/v1/admin/audit-logs", headers=admin_head)
    assert logs.status_code == 200
    assert logs.json()["total"] >= 1

    settings = await async_client.get("/api/v1/admin/settings", headers=admin_head)
    assert settings.status_code == 200
    assert "app_name" in settings.json()

    settings_update = await async_client.put(
        "/api/v1/admin/settings", headers=admin_head, json={"debug": False}
    )
    assert settings_update.status_code == 200

    live = await async_client.get("/api/v1/system/health/live", headers=admin_head)
    assert live.status_code == 200

    denied = await async_client.get("/api/v1/admin/statistics")
    assert denied.status_code == 401
