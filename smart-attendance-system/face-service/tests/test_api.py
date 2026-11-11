import base64

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app import main
from app.models import ensure_models

ensure_models()
client = TestClient(main.app)


def jpeg_b64(img: np.ndarray) -> str:
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode()


def test_health_ok():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "models": "ok"}


def test_blank_image_reports_no_face():
    res = client.post("/embed", json={"image": jpeg_b64(np.full((240, 320, 3), 200, np.uint8))})
    assert res.status_code == 422
    assert res.json() == {"error": "No face detected"}


def test_invalid_base64_rejected():
    res = client.post("/embed", json={"image": "!" * 200})
    assert res.status_code == 422
    assert "base64" in res.json()["error"]


def test_non_image_rejected():
    res = client.post("/embed", json={"image": base64.b64encode(b"x" * 300).decode()})
    assert res.status_code == 422
    assert res.json()["error"] == "Could not read image"


def test_token_enforced(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(main, "SERVICE_TOKEN", "secret")
    img = jpeg_b64(np.zeros((50, 50, 3), np.uint8))
    assert client.post("/embed", json={"image": img}).status_code == 401
    ok = client.post("/embed", json={"image": img}, headers={"X-Service-Token": "secret"})
    assert ok.status_code == 422  # authorised, but no face
