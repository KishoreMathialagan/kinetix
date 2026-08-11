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
            "first_name": "Rpt",
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
            "first_name": "Rpt",
            "last_name": "Therapist",
            "email": email,
            "password": "Password123!",
            "phone": "5554001",
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
async def test_reports_flow(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "rptpatient@test.com")
    therapist = await _create_therapist(async_client, admin_head, "rpttherapist@test.com")

    patient_report = await async_client.get(
        f"/api/v1/reports/patient/{patient['patient_id']}", headers=admin_head
    )
    assert patient_report.status_code == 200, patient_report.text
    assert patient_report.json()["report_type"] == "patient"
    assert patient_report.json()["patient"]["patient_code"]

    therapist_report = await async_client.get(
        f"/api/v1/reports/therapist/{therapist['id']}", headers=admin_head
    )
    assert therapist_report.status_code == 200, therapist_report.text
    assert therapist_report.json()["report_type"] == "therapist"
    assert "avg_rating" in therapist_report.json()

    clinic_report = await async_client.get("/api/v1/reports/clinic", headers=admin_head)
    assert clinic_report.status_code == 200, clinic_report.text
    assert clinic_report.json()["total_patients"] == 1
    assert clinic_report.json()["total_therapists"] == 1

    generated = await async_client.post(
        "/api/v1/reports/generate",
        headers=admin_head,
        json={"report_type": "patient", "patient_id": patient["patient_id"]},
    )
    assert generated.status_code == 200, generated.text
    report_id = generated.json()["report_id"]

    downloaded = await async_client.get(f"/api/v1/reports/{report_id}/download", headers=admin_head)
    assert downloaded.status_code == 200
    assert downloaded.json()["report_type"] == "patient"

    bad = await async_client.post(
        "/api/v1/reports/generate",
        headers=admin_head,
        json={"report_type": "patient"},
    )
    assert bad.status_code == 400


@pytest.mark.asyncio
async def test_dashboards(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "dashpatient@test.com")
    therapist = await _create_therapist(async_client, admin_head, "dashtherapist@test.com")

    admin_dash = await async_client.get("/api/v1/dashboard/admin", headers=admin_head)
    assert admin_dash.status_code == 200, admin_dash.text
    assert admin_dash.json()["total_patients"] == 1
    assert admin_dash.json()["total_therapists"] == 1

    login = await async_client.post(
        "/api/v1/auth/login", json={"email": "dashpatient@test.com", "password": "Password123!"}
    )
    patient_head = {"Authorization": f"Bearer {login.json()['access_token']}"}

    patient_dash = await async_client.get("/api/v1/dashboard/patient", headers=patient_head)
    assert patient_dash.status_code == 200, patient_dash.text
    assert patient_dash.json()["patient_id"] == patient["patient_id"]
    assert "unread_notifications" in patient_dash.json()

    # Patient cannot see admin dashboard
    denied = await async_client.get("/api/v1/dashboard/admin", headers=patient_head)
    assert denied.status_code == 403
