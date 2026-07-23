import base64
import io
import logging
import threading

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from app.config import (
    CLASS_MAP_2D_TO_3D,
    CLASSES,
    CLASSES_2D,
    CNN_2D_BACKBONE,
    CNN_2D_CHECKPOINT_PATH,
    IMAGE_SIZE_2D,
)
from app.cnn.dataset_2d import Alzheimer2DDataset
from app.cnn.gradcam import _GradCAM, _overlay, _target_layer
from app.cnn.model import build_model_2d

logger = logging.getLogger(__name__)

_model = None
_model_classes = CLASSES_2D
_lock = threading.Lock()


def load_input_tensor(filepath: str) -> torch.Tensor:
    im = Image.open(filepath).convert("L").resize((IMAGE_SIZE_2D, IMAGE_SIZE_2D), Image.BILINEAR)
    x = torch.from_numpy(np.asarray(im, dtype=np.uint8).copy()).float().div_(255.0).unsqueeze(0)
    x = (x - Alzheimer2DDataset.IMAGENET_MEAN) / Alzheimer2DDataset.IMAGENET_STD
    return x.expand(3, -1, -1).contiguous()


def _get_model():
    global _model, _model_classes
    if _model is None:
        with _lock:
            if _model is None:
                if not CNN_2D_CHECKPOINT_PATH.exists():
                    raise FileNotFoundError(
                        f"No trained 2D checkpoint at {CNN_2D_CHECKPOINT_PATH}. "
                        f"Run 'python -m app.cnn.train_2d' first."
                    )
                checkpoint = torch.load(CNN_2D_CHECKPOINT_PATH, map_location="cpu")
                classes = checkpoint.get("classes", CLASSES_2D)
                model = build_model_2d(pretrained=False,
                                        backbone=checkpoint.get("backbone", CNN_2D_BACKBONE),
                                        num_classes=len(classes))
                model.load_state_dict(checkpoint["model_state"])
                model.eval()
                _model, _model_classes = model, classes
                logger.info("Loaded 2D classifier (%s, %d classes) from %s",
                            checkpoint.get("backbone", CNN_2D_BACKBONE), len(classes),
                            CNN_2D_CHECKPOINT_PATH)
    return _model


def get_model_and_classes():
    return _get_model(), _model_classes


def predict(filepath: str) -> dict:
    model = _get_model()
    tensor = load_input_tensor(filepath).unsqueeze(0)
    with torch.no_grad():
        probs = F.softmax(model(tensor), dim=1).squeeze(0).tolist()
    probabilities = {cls: round(p, 4) for cls, p in zip(_model_classes, probs)}
    predicted_class = max(probabilities, key=probabilities.get)
    return {
        "predicted_class": predicted_class,
        "confidence": probabilities[predicted_class],
        "probabilities": probabilities,
    }


def predict_clinical(filepath: str) -> dict:
    raw = predict(filepath)
    probs3 = {c: 0.0 for c in CLASSES}
    for cls4, p in raw["probabilities"].items():
        probs3[CLASS_MAP_2D_TO_3D[cls4]] += p
    predicted3 = max(probs3, key=probs3.get)
    return {
        "predicted_class": predicted3,
        "confidence": round(probs3[predicted3], 4),
        "probabilities": {k: round(v, 4) for k, v in probs3.items()},
        "native_class": raw["predicted_class"],
    }


def generate_overlay_base64(filepath: str, predicted_class: str) -> str:
    model, classes = get_model_and_classes()
    class_idx = classes.index(predicted_class)

    tensor = load_input_tensor(filepath)
    cam = _GradCAM(model, _target_layer(model)).generate(tensor.unsqueeze(0), class_idx)

    base = np.asarray(
        Image.open(filepath).convert("L").resize((IMAGE_SIZE_2D, IMAGE_SIZE_2D), Image.BILINEAR),
        dtype=np.float32,
    ) / 255.0
    image = _overlay(base, cam)

    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")
