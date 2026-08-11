
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
            "first_name": "Bill",
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
    return {"user_id": response.json()["user_id"], "patient_id": me.json()["patient_id"], "headers": head}


async def _create_therapist(async_client: AsyncClient, head: dict, email: str) -> dict:
    response = await async_client.post(
        "/api/v1/therapists",
        headers=head,
        json={
            "first_name": "Bill",
            "last_name": "Therapist",
            "email": email,
            "password": "Password123!",
            "phone": "5555011",
            "license_number": f"LICB-{email.split('@')[0]}",
            "registration_number": f"REGB-{email.split('@')[0]}",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_invoice_payment_receipt_flow(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "billing1@test.com")
    therapist = await _create_therapist(async_client, admin_head, "billingther1@test.com")

    invoice = await async_client.post(
        "/api/v1/billing",
        headers=admin_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist["id"],
            "items": [
                {"description": "Physiotherapy session", "quantity": 2, "unit_price": 500},
            ],
            "gst_rate": 18,
            "due_date": "2026-09-01",
        },
    )
    assert invoice.status_code == 201, invoice.text
    invoice_data = invoice.json()
    assert invoice_data["invoice_number"].startswith("INV-")
    assert invoice_data["status"] == "issued"
    assert invoice_data["subtotal"] == 1000.0
    assert invoice_data["gst_rate"] == 18.0
    assert invoice_data["tax"] == 180.0
    assert invoice_data["total"] == 1180.0
    assert len(invoice_data["items"]) == 1
    invoice_id = invoice_data["id"]

    fetched = await async_client.get(f"/api/v1/billing/{invoice_id}", headers=admin_head)
    assert fetched.status_code == 200, fetched.text
    assert fetched.json()["invoice_number"] == invoice_data["invoice_number"]

    listing = await async_client.get("/api/v1/billing", headers=admin_head)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    partial = await async_client.post(
        "/api/v1/payments",
        headers=admin_head,
        json={
            "invoice_id": invoice_id,
            "amount": 500,
            "payment_method": "upi",
            "transaction_reference": "UPI-REF-001",
        },
    )
    assert partial.status_code == 201, partial.text
    assert partial.json()["status"] == "completed"

    after_partial = await async_client.get(f"/api/v1/billing/{invoice_id}", headers=admin_head)
    assert after_partial.status_code == 200
    assert after_partial.json()["status"] == "partially_paid"

    full = await async_client.post(
        "/api/v1/payments",
        headers=admin_head,
        json={
            "invoice_id": invoice_id,
            "amount": 680,
            "payment_method": "cash",
        },
    )
    assert full.status_code == 201, full.text

    after_full = await async_client.get(f"/api/v1/billing/{invoice_id}", headers=admin_head)
    assert after_full.json()["status"] == "paid"

    receipt = await async_client.get(f"/api/v1/billing/{invoice_id}/receipt", headers=admin_head)
    assert receipt.status_code == 200, receipt.text
    assert receipt.json()["paid_total"] == 1180.0
    assert receipt.json()["balance_due"] == 0.0
    assert len(receipt.json()["payments"]) == 2

    patient_notified = await async_client.get("/api/v1/notifications", headers=patient["headers"])
    assert patient_notified.status_code == 200
    assert patient_notified.json()["total"] >= 1


@pytest.mark.asyncio
async def test_invoice_rbac_and_cancel(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "billing2@test.com")
    other = await _register_patient(async_client, "billing2b@test.com")
    therapist = await _create_therapist(async_client, admin_head, "billingther2@test.com")

    invoice = await async_client.post(
        "/api/v1/billing",
        headers=admin_head,
        json={
            "patient_id": patient["patient_id"],
            "therapist_id": therapist["id"],
            "items": [{"description": "Consultation", "quantity": 1, "unit_price": 800}],
        },
    )
    assert invoice.status_code == 201, invoice.text
    invoice_id = invoice.json()["id"]

    patient_list = await async_client.get("/api/v1/billing", headers=patient["headers"])
    assert patient_list.status_code == 200
    assert patient_list.json()["total"] == 1

    other_list = await async_client.get("/api/v1/billing", headers=other["headers"])
    assert other_list.status_code == 200
    assert other_list.json()["total"] == 0

    other_fetch = await async_client.get(f"/api/v1/billing/{invoice_id}", headers=other["headers"])
    assert other_fetch.status_code == 403

    payment = await async_client.post(
        "/api/v1/payments",
        headers=other["headers"],
        json={"invoice_id": invoice_id, "amount": 100, "payment_method": "cash"},
    )
    assert payment.status_code == 403

    cancelled = await async_client.patch(
        f"/api/v1/billing/{invoice_id}",
        headers=admin_head,
        json={"status": "cancelled"},
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "cancelled"

    payment_after_cancel = await async_client.post(
        "/api/v1/payments",
        headers=admin_head,
        json={"invoice_id": invoice_id, "amount": 100, "payment_method": "cash"},
    )
    assert payment_after_cancel.status_code == 400

    audit = await async_client.get("/api/v1/admin/audit-logs?action=invoice_created", headers=admin_head)
    assert audit.status_code == 200
    assert audit.json()["total"] == 1


@pytest.mark.asyncio
async def test_treatment_packages(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "billing3@test.com")

    created = await async_client.post(
        "/api/v1/billing/packages",
        headers=admin_head,
        json={
            "name": "Knee Recovery Pack",
            "description": "6 sessions + assessments",
            "sessions_count": 6,
            "price": 3000,
            "gst_rate": 18,
        },
    )
    assert created.status_code == 201, created.text
    package_id = created.json()["id"]
    assert created.json()["is_active"] is True

    listing = await async_client.get("/api/v1/billing/packages", headers=admin_head)
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    denied = await async_client.post(
        "/api/v1/billing/packages",
        headers=patient["headers"],
        json={"name": "Nope", "sessions_count": 1, "price": 10},
    )
    assert denied.status_code == 403

    invoice = await async_client.post(
        "/api/v1/billing",
        headers=admin_head,
        json={"patient_id": patient["patient_id"], "package_id": package_id},
    )
    assert invoice.status_code == 201, invoice.text
    assert invoice.json()["package"] == "Knee Recovery Pack"
    assert invoice.json()["subtotal"] == 3000.0
    assert invoice.json()["tax"] == 540.0
    assert invoice.json()["total"] == 3540.0

    updated = await async_client.put(
        f"/api/v1/billing/packages/{package_id}",
        headers=admin_head,
        json={"price": 2800, "is_active": False},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["price"] == 2800.0

    deleted = await async_client.delete(f"/api/v1/billing/packages/{package_id}", headers=admin_head)
    assert deleted.status_code == 204

    gone = await async_client.get(f"/api/v1/billing/packages/{package_id}", headers=admin_head)
    assert gone.status_code == 404
