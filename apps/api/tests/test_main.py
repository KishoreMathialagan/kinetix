from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"] == {"status": "ok"}


def test_readiness_check() -> None:
    response = client.get("/api/v1/system/health/readiness")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["database"] == "ok"


def test_protected_route_requires_auth() -> None:
    response = client.get("/api/v1/users/")
    assert response.status_code == 401
    assert response.json()["success"] is False