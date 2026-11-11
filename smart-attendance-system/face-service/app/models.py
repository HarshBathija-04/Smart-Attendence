"""Download and verify the OpenCV Zoo face models (run at build time)."""

import hashlib
import os
import sys
import urllib.request
from pathlib import Path

MODEL_DIR = Path(os.getenv("MODEL_DIR", Path(__file__).resolve().parent.parent / "models"))

ZOO = "https://github.com/opencv/opencv_zoo/raw/main/models"
MODELS = {
    "yunet.onnx": (
        f"{ZOO}/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    ),
    "sface.onnx": (
        f"{ZOO}/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
    ),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ensure_models() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for name, (url, digest) in MODELS.items():
        target = MODEL_DIR / name
        if target.exists() and sha256(target) == digest:
            continue
        print(f"Downloading {name} ...", flush=True)
        tmp = target.with_suffix(".part")
        urllib.request.urlretrieve(url, tmp)  # noqa: S310 - fixed https URL
        if sha256(tmp) != digest:
            tmp.unlink(missing_ok=True)
            sys.exit(f"Checksum mismatch for {name}")
        tmp.replace(target)


if __name__ == "__main__":
    ensure_models()
    print(f"Models ready in {MODEL_DIR}")
