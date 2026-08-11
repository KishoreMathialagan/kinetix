
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_creates_patient_user(async_client: AsyncClient, setup_test_db) -> None:
    payload = {
        "first_name": "Test",
        "last_name": "Patient",
        "email": "patient@test.com",
        "phone": "5550100",
        "password": "Password123!",
        "dob": "1990-01-01",
        "gender": "female",
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["otp"]
    assert body["email"] == "patient@test.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient, setup_test_db) -> None:
    payload = {
        "first_name": "Dup",
        "last_name": "User",
        "email": "dup@test.com",
        "password": "Password123!",
    }
    first = await async_client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = await async_client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400


@pytest.mark.asyncio
async def test_otp_verify_registration_marks_verified(async_client: AsyncClient, setup_test_db) -> None:
    payload = {
        "first_name": "OTP",
        "last_name": "User",
        "email": "otp@test.com",
        "password": "Password123!",
    }
    reg = await async_client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201
    otp = reg.json()["otp"]
    response = await async_client.post(
        "/api/v1/auth/otp/verify",
        json={"email": "otp@test.com", "otp": otp, "purpose": "registration"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_forgot_and_reset_password(async_client: AsyncClient, setup_test_db) -> None:
    payload = {
        "first_name": "Reset",
        "last_name": "User",
        "email": "reset@test.com",
        "password": "Password123!",
    }
    reg = await async_client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201

    forgot = await async_client.post(
        "/api/v1/auth/forgot", json={"email": "reset@test.com"}
    )
    assert forgot.status_code == 202
    otp = forgot.json()["otp"]

    reset = await async_client.post(
        "/api/v1/auth/reset",
        json={"email": "reset@test.com", "otp": otp, "new_password": "NewPassword456!"},
    )
    assert reset.status_code == 200

    login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "reset@test.com", "password": "NewPassword456!"},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]


@pytest.mark.asyncio
async def test_auth_me_returns_role(async_client: AsyncClient, setup_test_db) -> None:
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Me",
            "last_name": "User",
            "email": "me@test.com",
            "password": "Password123!",
        },
    )
    assert reg.status_code == 201
    login = await async_client.post(
        "/api/v1/auth/login", json={"email": "me@test.com", "password": "Password123!"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["role"] == "patient"
    assert me.json()["email"] == "me@test.com"


@pytest.mark.asyncio
async def test_auth_me_requires_auth(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401