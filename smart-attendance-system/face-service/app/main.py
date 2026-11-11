"""Face embedding service.

Stateless: it turns an image into a 128-d SFace embedding. Matching against
enrolled students happens in the Node API, which owns the database.
"""

import base64
import binascii
import os
import secrets
import threading

import cv2
import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.models import MODEL_DIR

MAX_IMAGE_BYTES = 6 * 1024 * 1024
MAX_SIDE = 1280
SERVICE_TOKEN = os.getenv("FACE_SERVICE_TOKEN", "")

app = FastAPI(
    title="Smart Attendance Face Service",
    docs_url=None if os.getenv("ENV") == "production" else "/docs",
    redoc_url=None,
)

_lock = threading.Lock()  # OpenCV DNN objects are not thread-safe
_detector = None
_recognizer = None


def _models():
    global _detector, _recognizer
    if _detector is None:
        _detector = cv2.FaceDetectorYN.create(str(MODEL_DIR / "yunet.onnx"), "", (320, 320), 0.8)
        _recognizer = cv2.FaceRecognizerSF.create(str(MODEL_DIR / "sface.onnx"), "")
    return _detector, _recognizer


def require_token(x_service_token: str = Header(default="")) -> None:
    if SERVICE_TOKEN and not secrets.compare_digest(x_service_token, SERVICE_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid service token")


class EmbedRequest(BaseModel):
    image: str = Field(min_length=100, max_length=MAX_IMAGE_BYTES * 2)


def decode_image(data: str) -> np.ndarray:
    if data.startswith("data:"):
        data = data.split(",", 1)[-1]
    try:
        raw = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Image is not valid base64") from exc
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large")
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=422, detail="Could not read image")
    scale = MAX_SIDE / max(img.shape[:2])
    if scale < 1:
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    return img


def embed(img: np.ndarray) -> tuple[list[float], int, float]:
    """Return (embedding of the largest face, number of faces, detector score)."""
    with _lock:
        detector, recognizer = _models()
        h, w = img.shape[:2]
        detector.setInputSize((w, h))
        _, faces = detector.detect(img)
        if faces is None or len(faces) == 0:
            raise HTTPException(status_code=422, detail="No face detected")
        face = max(faces, key=lambda f: f[2] * f[3])
        aligned = recognizer.alignCrop(img, face)
        feature = recognizer.feature(aligned).flatten()
    feature = feature / (np.linalg.norm(feature) or 1.0)
    return [round(float(x), 6) for x in feature], len(faces), float(face[-1])


@app.exception_handler(HTTPException)
async def http_error(_, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.get("/health")
def health():
    ready = all((MODEL_DIR / n).exists() for n in ("yunet.onnx", "sface.onnx"))
    return JSONResponse(
        status_code=200 if ready else 503,
        content={"status": "ok" if ready else "error", "models": "ok" if ready else "missing"},
    )


@app.post("/embed", dependencies=[Depends(require_token)])
def embed_route(body: EmbedRequest):
    embedding, faces, score = embed(decode_image(body.image))
    return {"embedding": embedding, "faces": faces, "detectionScore": round(score, 4)}
