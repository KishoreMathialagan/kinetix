
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
            "first_name": "Ver",
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
async def test_document_versions_and_bulk_upload(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "version@test.com")

    files = {
        "file": ("v1.pdf", io.BytesIO(b"%PDF-1.4 version one content"), "application/pdf"),
    }
    upload = await async_client.post(
        f"/api/v1/patients/{patient['patient_id']}/documents",
        headers=admin_head,
        data={"doc_type": "mri"},
        files=files,
    )
    assert upload.status_code == 201, upload.text
    doc_id = upload.json()["id"]

    versions = await async_client.get(f"/api/v1/documents/{doc_id}/versions", headers=admin_head)
    assert versions.status_code == 200
    assert len(versions.json()) == 1
    assert versions.json()[0]["version_no"] == 1

    files_v2 = {
        "file": ("v2.pdf", io.BytesIO(b"%PDF-1.4 version two content"), "application/pdf"),
    }
    add_version = await async_client.post(
        f"/api/v1/documents/{doc_id}/versions",
        headers=admin_head,
        data={"note": "Updated after review"},
        files=files_v2,
    )
    assert add_version.status_code == 201, add_version.text
    assert add_version.json()["version_no"] == 2
    v2_id = add_version.json()["id"]

    versions_after = await async_client.get(f"/api/v1/documents/{doc_id}/versions", headers=admin_head)
    assert versions_after.status_code == 200
    assert len(versions_after.json()) == 2
    assert versions_after.json()[0]["version_no"] == 2

    latest = await async_client.get(f"/api/v1/documents/{doc_id}", headers=admin_head)
    assert latest.status_code == 200
    assert latest.content == b"%PDF-1.4 version two content"

    historical = await async_client.get(f"/api/v1/documents/{doc_id}/versions/{v2_id}", headers=admin_head)
    assert historical.status_code == 200
    assert historical.content == b"%PDF-1.4 version two content"

    v1_id = versions.json()[0]["id"]
    old_content = await async_client.get(f"/api/v1/documents/{doc_id}/versions/{v1_id}", headers=admin_head)
    assert old_content.status_code == 200
    assert old_content.content == b"%PDF-1.4 version one content"

    deleted_version = await async_client.delete(
        f"/api/v1/documents/{doc_id}/versions/{v1_id}", headers=admin_head
    )
    assert deleted_version.status_code == 204

    versions_final = await async_client.get(f"/api/v1/documents/{doc_id}/versions", headers=admin_head)
    assert versions_final.status_code == 200
    assert len(versions_final.json()) == 1

    bulk_files = [
        ("files", ("bulk1.pdf", io.BytesIO(b"%PDF-1.4 bulk one"), "application/pdf")),
        ("files", ("bulk2.pdf", io.BytesIO(b"%PDF-1.4 bulk two"), "application/pdf")),
    ]
    bulk = await async_client.post(
        "/api/v1/documents/bulk",
        headers=admin_head,
        data={"patient_id": patient["patient_id"], "doc_type": "prescription"},
        files=bulk_files,
    )
    assert bulk.status_code == 201, bulk.text
    assert len(bulk.json()) == 2
