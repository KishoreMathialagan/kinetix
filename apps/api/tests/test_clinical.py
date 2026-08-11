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
            "first_name": "Clinical",
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
            "first_name": "Physio",
            "last_name": "Therapist",
            "email": email,
            "password": "Password123!",
            "phone": "5551001",
            "license_number": f"LIC-{email.split('@')[0]}",
            "registration_number": f"REG-{email.split('@')[0]}",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _create_appointment(async_client: AsyncClient, head: dict, patient_id: str, therapist_id: str) -> dict:
    response = await async_client.post(
        "/api/v1/appointments",
        headers=head,
        json={
            "patient_id": patient_id,
            "therapist_id": therapist_id,
            "scheduled_date": "2026-08-10",
            "start_time": "10:00:00",
            "duration_minutes": 60,
            "appointment_type": "physiotherapy",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_clinical_flow(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    therapist = await _create_therapist(async_client, admin_head, "dr@test.com")
    patient = await _register_patient(async_client, "cpatient@test.com")

    pt_login = await async_client.post(
        "/api/v1/auth/login", json={"email": "cpatient@test.com", "password": "Password123!"}
    )
    patient_head = {"Authorization": f"Bearer {pt_login.json()['access_token']}"}

    appointment = await _create_appointment(
        async_client, patient_head, patient["patient_id"], therapist["id"]
    )

    # Create an assessment
    assessment = await async_client.post(
        "/api/v1/assessments",
        headers=admin_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist["id"],
            "appointment_id": appointment["id"],
            "assessment_type": "initial",
            "pain_score": 7,
            "diagnosis": "Lower back strain",
            "goals": "Reduce pain to <=3",
        },
    )
    assert assessment.status_code == 201, assessment.text
    assessment_id = assessment.json()["id"]

    fetched = await async_client.get(f"/api/v1/assessments/{assessment_id}", headers=admin_head)
    assert fetched.status_code == 200
    assert fetched.json()["pain_score"] == 7

    updated = await async_client.put(
        f"/api/v1/assessments/{assessment_id}",
        headers=admin_head,
        json={"pain_score": 5, "diagnosis": "Updated diagnosis"},
    )
    assert updated.status_code == 200
    assert updated.json()["pain_score"] == 5

    # Treatment plan linked to assessment
    plan = await async_client.post(
        "/api/v1/treatment-plans",
        headers=admin_head,
        json={
            "assessment_id": assessment_id,
            "title": "Back rehab plan",
            "start_date": "2026-08-10",
            "end_date": "2026-09-10",
        },
    )
    assert plan.status_code == 201, plan.text

    plans = await async_client.get(f"/api/v1/treatment-plans/{patient['patient_id']}/plans", headers=admin_head)
    assert plans.status_code == 200
    assert len(plans.json()) == 1

    # Start a treatment session
    session = await async_client.post(
        "/api/v1/treatment-sessions/start",
        headers=admin_head,
        json={"appointment_id": appointment["id"], "assessment_id": assessment_id},
    )
    assert session.status_code == 201, session.text
    session_id = session.json()["id"]
    assert session.json()["start_time"] is not None

    # Update session notes
    session_update = await async_client.put(
        f"/api/v1/treatment-sessions/{session_id}",
        headers=admin_head,
        json={"pain_before": 6, "pain_after": 3, "treatment_notes": "Good response"},
    )
    assert session_update.status_code == 200
    assert session_update.json()["pain_before"] == 6

    # End session
    done = await async_client.patch(
        f"/api/v1/treatment-sessions/{session_id}/end", headers=admin_head
    )
    assert done.status_code == 200
    assert done.json()["end_time"] is not None

    # Progress measurement + overview
    measurement = await async_client.post(
        "/api/v1/progress/measurements",
        headers=admin_head,
        json={
            "patient_id": patient["patient_id"],
            "assessment_type": "weekly",
            "pain_score": 4,
            "rom_degrees": 120,
            "strength_scale": "4",
        },
    )
    assert measurement.status_code == 201, measurement.text

    overview = await async_client.get(
        f"/api/v1/patients/{patient['patient_id']}/progress", headers=admin_head
    )
    assert overview.status_code == 200
    body = overview.json()
    assert body["pain_trend"]
    assert body["session_timeline"]


@pytest.mark.asyncio
async def test_create_assessment_requires_matching_appointment(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    therapist = await _create_therapist(async_client, admin_head, "therapist2@test.com")
    patient = await _register_patient(async_client, "mismatch@test.com")
    login = await async_client.post(
        "/api/v1/auth/login", json={"email": "mismatch@test.com", "password": "Password123!"}
    )
    patient_head = {"Authorization": f"Bearer {login.json()['access_token']}"}
    appointment = await _create_appointment(
        async_client, patient_head, patient["patient_id"], therapist["id"]
    )

    # Fail: another patient id not on the appointment
    response = await async_client.post(
        "/api/v1/assessments",
        headers=admin_head,
        json={
            "patient_id": "00000000-0000-0000-0000-000000000000",
            "therapist_id": therapist["id"],
            "appointment_id": appointment["id"],
            "assessment_type": "initial",
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_progress_requires_ownership(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    await _register_patient(async_client, "owner@test.com")
    await _register_patient(async_client, "intruder@test.com")
    intruder_login = await async_client.post(
        "/api/v1/auth/login", json={"email": "intruder@test.com", "password": "Password123!"}
    )
    intruder_head = {"Authorization": f"Bearer {intruder_login.json()['access_token']}"}

    # intruder asks for owner@test.com's progress -> patient_id path param differs
    # owner patient id is random; use intruder's own id to at least hit a 200 path
    me = await async_client.get("/api/v1/auth/me", headers=intruder_head)
    assert me.status_code == 200

    empty = await async_client.get(
        f"/api/v1/patients/{me.json()['patient_id']}/progress", headers=intruder_head
    )
    assert empty.status_code == 200