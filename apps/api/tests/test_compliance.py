
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
            "first_name": "Comp",
            "last_name": "Patient",
            "email": email,
            "password": "Password123!",
            "gender": "male",
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
    return {"user_id": response.json()["user_id"], "patient_id": me.json()["patient_id"], "headers": head}


async def _create_therapist(async_client: AsyncClient, head: dict, email: str) -> dict:
    response = await async_client.post(
        "/api/v1/therapists",
        headers=head,
        json={
            "first_name": "Comp",
            "last_name": "Therapist",
            "email": email,
            "password": "Password123!",
            "phone": "5555022",
            "license_number": f"LICC-{email.split('@')[0]}",
            "registration_number": f"REGC-{email.split('@')[0]}",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert response.status_code == 201, response.text
    login = await async_client.post(
        "/api/v1/auth/login", json={"email": email, "password": "Password123!"}
    )
    assert login.status_code == 200, login.text
    return {"id": response.json()["id"], "headers": {"Authorization": f"Bearer {login.json()['access_token']}"}}


@pytest.mark.asyncio
async def test_exercise_checkin_and_compliance(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "compliance@test.com")
    therapist = await _create_therapist(async_client, admin_head, "compliancether@test.com")

    program = await async_client.post(
        "/api/v1/exercise-programs",
        headers=admin_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist["id"],
            "title": "Knee Rehab",
            "frequency": "Daily",
            "items": [
                {"exercise_name": "Quad Sets", "repetitions": 10, "sets": 3},
                {"exercise_name": "Heel Slides", "repetitions": 10, "sets": 3},
                {"exercise_name": "Leg Raises", "repetitions": 8, "sets": 3},
            ],
        },
    )
    assert program.status_code == 201, program.text
    program_id = program.json()["id"]
    item_ids = [item["id"] for item in program.json()["exercise_items"]]
    assert len(item_ids) == 3

    checkin = await async_client.post(
        f"/api/v1/exercise-programs/{program_id}/check-in",
        headers=patient["headers"],
        json={"exercise_item_id": item_ids[0], "notes": "Felt good"},
    )
    assert checkin.status_code == 201, checkin.text
    assert checkin.json()["exercise_item_id"] == item_ids[0]

    await async_client.post(
        f"/api/v1/exercise-programs/{program_id}/check-in",
        headers=therapist["headers"],
        json={"exercise_item_id": item_ids[1]},
    )

    duplicate = await async_client.post(
        f"/api/v1/exercise-programs/{program_id}/check-in",
        headers=patient["headers"],
        json={"exercise_item_id": item_ids[0]},
    )
    assert duplicate.status_code == 201

    compliance = await async_client.get(
        f"/api/v1/exercise-programs/{program_id}/compliance", headers=patient["headers"]
    )
    assert compliance.status_code == 200, compliance.text
    assert compliance.json()["expected_count"] == 3
    assert compliance.json()["completed_count"] == 2
    assert compliance.json()["score"] == 66.67

    bad_item = await async_client.post(
        f"/api/v1/exercise-programs/{program_id}/check-in",
        headers=patient["headers"],
        json={"exercise_item_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert bad_item.status_code == 400

    patient_summary = await async_client.get(
        f"/api/v1/patients/{patient['patient_id']}/compliance", headers=admin_head
    )
    assert patient_summary.status_code == 200, patient_summary.text
    assert patient_summary.json()["program_count"] == 1
    assert patient_summary.json()["overall_score"] == 66.67

    report = await async_client.post(
        "/api/v1/reports/generate",
        headers=admin_head,
        json={"report_type": "patient", "patient_id": patient["patient_id"]},
    )
    assert report.status_code == 200, report.text
    assert report.json()["exercise_compliance"]["score"] == 66.67
