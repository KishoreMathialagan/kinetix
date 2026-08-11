import uuid

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
            "first_name": "Pass",
            "last_name": "Patient",
            "email": email,
            "password": "Password123!",
            "gender": "female",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _create_therapist(async_client: AsyncClient, head: dict, email: str) -> dict:
    response = await async_client.post(
        "/api/v1/therapists",
        headers=head,
        json={
            "first_name": "Pass",
            "last_name": "Therapist",
            "email": email,
            "password": "Password123!",
            "phone": "5554001",
            "license_number": f"LICP-{email.split('@')[0]}",
            "registration_number": f"REGP-{email.split('@')[0]}",
            "department": "Physiotherapy",
            "qualification": "DPT",
            "specialization": "Orthopedic",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_admin_resets_patient_password(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "resetpatient@test.com")
    user_id = patient["user_id"]

    response = await async_client.put(
        f"/api/v1/users/{user_id}/password",
        headers=admin_head,
        json={"new_password": "NewPatient456!"},
    )
    assert response.status_code == 200, response.text

    old_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "resetpatient@test.com", "password": "Password123!"},
    )
    assert old_login.status_code == 401

    new_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "resetpatient@test.com", "password": "NewPatient456!"},
    )
    assert new_login.status_code == 200
    assert new_login.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_resets_therapist_password(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    therapist = await _create_therapist(async_client, admin_head, "resetther@test.com")

    response = await async_client.put(
        f"/api/v1/users/{therapist['user_id']}/password",
        headers=admin_head,
        json={"new_password": "NewTherapist456!"},
    )
    assert response.status_code == 200, response.text

    login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "resetther@test.com", "password": "NewTherapist456!"},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]


@pytest.mark.asyncio
async def test_reset_password_requires_admin(async_client: AsyncClient, setup_test_db) -> None:
    patient = await _register_patient(async_client, "resetpatientuser@test.com")
    login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "resetpatientuser@test.com", "password": "Password123!"},
    )
    assert login.status_code == 200
    patient_head = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = await async_client.put(
        f"/api/v1/users/{patient['user_id']}/password",
        headers=patient_head,
        json={"new_password": "NewPassword456!"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_reset_password_unknown_user(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    response = await async_client.put(
        f"/api/v1/users/{uuid.uuid4()}/password",
        headers=admin_head,
        json={"new_password": "NewPassword456!"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_admin_cannot_reset_another_admin_password(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    me = await async_client.get("/api/v1/auth/me", headers=admin_head)
    assert me.status_code == 200
    admin_id = me.json()["id"]

    response = await async_client.put(
        f"/api/v1/users/{admin_id}/password",
        headers=admin_head,
        json={"new_password": "NewAdmin456!"},
    )
    assert response.status_code == 403