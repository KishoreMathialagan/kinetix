import io

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
            "first_name": "Doc",
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
async def test_documents_flow(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "docpatient@test.com")

    files = {
        "file": ("report.pdf", io.BytesIO(b"%PDF-1.4 fake pdf content"), "application/pdf"),
    }
    upload = await async_client.post(
        f"/api/v1/patients/{patient['patient_id']}/documents",
        headers=admin_head,
        data={"doc_type": "prescription"},
        files=files,
    )
    assert upload.status_code == 201, upload.text
    doc_id = upload.json()["id"]

    listing = await async_client.get(
        f"/api/v1/patients/{patient['patient_id']}/documents", headers=admin_head
    )
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    download = await async_client.get(f"/api/v1/documents/{doc_id}", headers=admin_head)
    assert download.status_code == 200
    assert download.content == b"%PDF-1.4 fake pdf content"

    deleted = await async_client.delete(f"/api/v1/documents/{doc_id}", headers=admin_head)
    assert deleted.status_code == 204

    missing = await async_client.get(f"/api/v1/documents/{doc_id}", headers=admin_head)
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_consents_flow(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "consent@test.com")

    files = {
        "file": ("consent_template.pdf", io.BytesIO(b"%PDF-1.4 consent template"), "application/pdf"),
    }
    template = await async_client.post(
        "/api/v1/consents/templates",
        headers=admin_head,
        data={"patient_id": patient["patient_id"], "template_name": "Standard Consent"},
        files=files,
    )
    assert template.status_code == 201, template.text
    form_id = template.json()["id"]
    assert template.json()["pdf_url"]

    listing = await async_client.get("/api/v1/consents", headers=admin_head)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    signed = await async_client.post(
        f"/api/v1/consents/{form_id}/sign",
        headers=admin_head,
        json={
            "consent_form_id": form_id,
            "signer_name": "John Doe",
            "signer_role": "patient",
            "signature_url": "/uploads/sig.png",
        },
    )
    assert signed.status_code == 200, signed.text
    assert signed.json()["signed_at"] is not None
    assert signed.json()["signed_by"] == "John Doe"

    pdf = await async_client.get(f"/api/v1/consents/{form_id}/pdf", headers=admin_head)
    assert pdf.status_code == 200
    assert pdf.content == b"%PDF-1.4 consent template"

    bad = await async_client.post(
        "/api/v1/consents/00000000-0000-0000-0000-000000000000/sign",
        headers=admin_head,
        json={
            "consent_form_id": "00000000-0000-0000-0000-000000000000",
            "signer_name": "Ghost",
            "signer_role": "patient",
            "signature_url": "/x.png",
        },
    )
    assert bad.status_code == 404
