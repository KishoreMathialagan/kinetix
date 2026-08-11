
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
            "first_name": "Note",
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


@pytest.mark.asyncio
async def test_device_tokens_and_email_notification(async_client: AsyncClient, setup_test_db) -> None:
    admin_head = await _admin_headers(async_client)
    patient = await _register_patient(async_client, "notify@test.com")

    registered = await async_client.post(
        "/api/v1/notifications/device-tokens",
        headers=patient["headers"],
        json={"platform": "android", "token": "fcm-token-abcdef123456"},
    )
    assert registered.status_code == 201, registered.text
    token_id = registered.json()["id"]

    duplicate = await async_client.post(
        "/api/v1/notifications/device-tokens",
        headers=patient["headers"],
        json={"platform": "ios", "token": "fcm-token-abcdef123456"},
    )
    assert duplicate.status_code == 201
    assert duplicate.json()["id"] == token_id

    listing = await async_client.get("/api/v1/notifications/device-tokens", headers=patient["headers"])
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    email_notification = await async_client.post(
        "/api/v1/notifications",
        headers=admin_head,
        json={
            "user_id": patient["user_id"],
            "title": "Reminder",
            "body": "Your appointment is tomorrow.",
            "notification_type": "email",
        },
    )
    assert email_notification.status_code == 201, email_notification.text
    assert email_notification.json()["notification_type"] == "email"

    push_notification = await async_client.post(
        "/api/v1/notifications",
        headers=admin_head,
        json={
            "user_id": patient["user_id"],
            "title": "Push test",
            "body": "Hello push",
            "notification_type": "push",
        },
    )
    assert push_notification.status_code == 201, push_notification.text

    unread = await async_client.get("/api/v1/notifications/unread-count", headers=patient["headers"])
    assert unread.status_code == 200
    assert unread.json()["count"] >= 2

    deleted = await async_client.delete(
        f"/api/v1/notifications/device-tokens/{token_id}", headers=patient["headers"]
    )
    assert deleted.status_code == 204

    listing_after = await async_client.get("/api/v1/notifications/device-tokens", headers=patient["headers"])
    assert listing_after.status_code == 200
    assert len(listing_after.json()) == 0
