import logging
import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.cnn import infer_2d
from app.config import IMAGE_EXTENSIONS_2D
from app.schemas import MriPredictResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/predict/mri", response_model=MriPredictResponse)
async def predict_mri(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[1].lower()
    if suffix not in IMAGE_EXTENSIONS_2D:
        raise HTTPException(status_code=400,
                            detail=f"Only {', '.join(IMAGE_EXTENSIONS_2D)} files are supported")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = infer_2d.predict_clinical(tmp_path)
        gradcam_target = result.pop("native_class")
        try:
            result["gradcam_image_base64"] = infer_2d.generate_overlay_base64(tmp_path, gradcam_target)
        except Exception:
            logger.exception("Grad-CAM generation failed, returning prediction without it")
            result["gradcam_image_base64"] = None
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("CNN inference failed")
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return MriPredictResponse(**result)
