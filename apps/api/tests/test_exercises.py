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
            "first_name": "Exercise",
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


@pytest.mark.asyncio
async def test_exercise_program_flow(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "expatient@test.com")

    therapist = await async_client.post(
        "/api/v1/therapists",
        headers=admin_head,
        json={
            "first_name": "Ex",
            "last_name": "Physio",
            "email": "exphysio@test.com",
            "password": "Password123!",
            "phone": "5552001",
            "license_number": "LIC-exphysio",
            "registration_number": "REG-exphysio",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert therapist.status_code == 201, therapist.text
    therapist_id = therapist.json()["id"]

    program = await async_client.post(
        "/api/v1/exercise-programs",
        headers=admin_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist_id,
            "title": "Knee rehab",
            "instructions": "Twice daily",
            "frequency": "2x daily",
            "duration": "4 weeks",
            "items": [
                {"exercise_name": "Leg raises", "category": "strength", "sets": 3, "repetitions": 10},
                {"exercise_name": "Hamstring stretch", "category": "flexibility", "duration": "30s"},
            ],
        },
    )
    assert program.status_code == 201, program.text
    program_id = program.json()["id"]
    assert program.json()["therapist_id"] == therapist_id
    assert len(program.json()["exercise_items"]) == 2

    item_id = program.json()["exercise_items"][0]["id"]

    # Patient sees their own program
    login = await async_client.post(
        "/api/v1/auth/login", json={"email": "expatient@test.com", "password": "Password123!"}
    )
    patient_head = {"Authorization": f"Bearer {login.json()['access_token']}"}
    mine = await async_client.get(f"/api/v1/exercise-programs/{program_id}", headers=patient_head)
    assert mine.status_code == 200

    listed = await async_client.get(
        f"/api/v1/exercise-programs?patient_id={patient['patient_id']}", headers=patient_head
    )
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    # Update program + item
    updated = await async_client.put(
        f"/api/v1/exercise-programs/{program_id}",
        headers=admin_head,
        json={"title": "Knee rehab v2"},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Knee rehab v2"

    item_update = await async_client.put(
        f"/api/v1/exercise-programs/{program_id}/items/{item_id}",
        headers=admin_head,
        json={"repetitions": 12},
    )
    assert item_update.status_code == 200
    assert item_update.json()["repetitions"] == 12

    # Exercise library
    library = await async_client.get("/api/v1/exercise-library", headers=patient_head)
    assert library.status_code == 200
    assert library.json()["total"] >= 2

    # Delete item then program
    deleted_item = await async_client.delete(
        f"/api/v1/exercise-programs/{program_id}/items/{item_id}", headers=admin_head
    )
    assert deleted_item.status_code == 204

    deleted_program = await async_client.delete(
        f"/api/v1/exercise-programs/{program_id}", headers=admin_head
    )
    assert deleted_program.status_code == 204


@pytest.mark.asyncio
async def test_exercise_program_ownership(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "exowner@test.com")
    intruder = await _register_patient(async_client, "exintruder@test.com")

    therapist = await async_client.post(
        "/api/v1/therapists",
        headers=admin_head,
        json={
            "first_name": "Own",
            "last_name": "Physio",
            "email": "ownphysio@test.com",
            "password": "Password123!",
            "phone": "5552002",
            "license_number": "LIC-ownphysio",
            "registration_number": "REG-ownphysio",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert therapist.status_code == 201, therapist.text

    program = await async_client.post(
        "/api/v1/exercise-programs",
        headers=admin_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist.json()["id"],
            "title": "Owned program",
            "items": [{"exercise_name": "Squats", "category": "strength", "sets": 3, "repetitions": 12}],
        },
    )
    assert program.status_code == 201, program.text
    program_id = program.json()["id"]
    item_id = program.json()["exercise_items"][0]["id"]

    intruder_login = await async_client.post(
        "/api/v1/auth/login", json={"email": "exintruder@test.com", "password": "Password123!"}
    )
    intruder_head = {"Authorization": f"Bearer {intruder_login.json()['access_token']}"}

    # Intruder cannot read or mutate the program or its items
    forbidden = await async_client.get(f"/api/v1/exercise-programs/{program_id}", headers=intruder_head)
    assert forbidden.status_code == 403

    forbidden_update = await async_client.put(
        f"/api/v1/exercise-programs/{program_id}",
        headers=intruder_head,
        json={"title": "Hijack"},
    )
    assert forbidden_update.status_code == 403

    forbidden_item = await async_client.put(
        f"/api/v1/exercise-programs/{program_id}/items/{item_id}",
        headers=intruder_head,
        json={"sets": 9},
    )
    assert forbidden_item.status_code == 403

    # Owner (admin) still fine
    ok = await async_client.get(f"/api/v1/exercise-programs/{program_id}", headers=admin_head)
    assert ok.status_code == 200
