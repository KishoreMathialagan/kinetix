
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
            "first_name": "Rev",
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
            "first_name": "Rev",
            "last_name": "Therapist",
            "email": email,
            "password": "Password123!",
            "phone": "5555033",
            "license_number": f"LICD-{email.split('@')[0]}",
            "registration_number": f"REGD-{email.split('@')[0]}",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_admin_dashboard_revenue_and_analytics(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "dashrev@test.com")
    therapist = await _create_therapist(async_client, admin_head, "dashrevther@test.com")

    baseline = await async_client.get("/api/v1/dashboard/admin", headers=admin_head)
    assert baseline.status_code == 200, baseline.text
    assert baseline.json()["revenue"]["total_billed"] == 0.0

    invoice = await async_client.post(
        "/api/v1/billing",
        headers=admin_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist["id"],
            "items": [{"description": "Session", "quantity": 1, "unit_price": 1000}],
            "gst_rate": 18,
        },
    )
    assert invoice.status_code == 201, invoice.text

    payment = await async_client.post(
        "/api/v1/payments",
        headers=admin_head,
        json={"invoice_id": invoice.json()["id"], "amount": 1180, "payment_method": "bank_transfer"},
    )
    assert payment.status_code == 201, payment.text

    dashboard = await async_client.get("/api/v1/dashboard/admin", headers=admin_head)
    assert dashboard.status_code == 200
    assert dashboard.json()["revenue"]["total_billed"] == 1180.0
    assert dashboard.json()["revenue"]["total_collected"] == 1180.0
    assert dashboard.json()["revenue"]["outstanding"] == 0.0
    assert dashboard.json()["revenue"]["total_invoices"] == 1
    assert dashboard.json()["revenue"]["avg_invoice_value"] == 1180.0

    analytics = await async_client.get("/api/v1/dashboard/admin/analytics?days=30", headers=admin_head)
    assert analytics.status_code == 200, analytics.text
    assert analytics.json()["revenue"]["billed"] == 1180.0
    assert analytics.json()["revenue"]["collected"] == 1180.0
    assert analytics.json()["revenue"]["invoice_count"] == 1
    assert len(analytics.json()["therapist_productivity"]) == 1
    assert analytics.json()["therapist_productivity"][0]["completed_sessions"] == 0

    denied = await async_client.get("/api/v1/dashboard/admin/analytics")
    assert denied.status_code == 401
