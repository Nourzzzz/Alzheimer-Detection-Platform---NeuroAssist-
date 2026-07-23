import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageFilter

OUTPUT_SIZE = 512
OVERLAY_MAX_ALPHA = 0.55
ALPHA_FLOOR = 0.35
ALPHA_GAMMA = 1.6

_TURBO = np.array([
    [0.190, 0.072, 0.232],
    [0.253, 0.265, 0.899],
    [0.163, 0.471, 0.994],
    [0.079, 0.694, 0.842],
    [0.216, 0.862, 0.518],
    [0.526, 0.958, 0.223],
    [0.820, 0.883, 0.176],
    [0.973, 0.647, 0.191],
    [0.878, 0.281, 0.140],
], dtype=np.float32)


def _normalize01(cam: np.ndarray) -> np.ndarray:
    cam = cam - cam.min()
    peak = cam.max()
    if peak > 1e-8:
        cam = cam / peak
    return cam


class _GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.activations: torch.Tensor | None = None
        self.gradients: torch.Tensor | None = None
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, inputs, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor: torch.Tensor, class_idx: int) -> np.ndarray:
        self.model.zero_grad()
        output = self.model(input_tensor)
        score = output[0, class_idx]
        score.backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = F.relu((weights * self.activations).sum(dim=1, keepdim=True))
        cam = F.interpolate(cam, size=input_tensor.shape[-2:], mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        return _normalize01(cam)


def _apply_colormap(cam: np.ndarray) -> np.ndarray:
    n = len(_TURBO) - 1
    x = np.clip(cam, 0.0, 1.0) * n
    lo = np.floor(x).astype(int)
    hi = np.minimum(lo + 1, n)
    frac = (x - lo)[..., None]
    return _TURBO[lo] * (1 - frac) + _TURBO[hi] * frac


def _prepare_cam(cam: np.ndarray, size: int) -> np.ndarray:
    cam = cam.astype(np.float32)
    peak = np.percentile(cam, 99.0)
    cam = cam / peak if peak > 1e-6 else cam
    cam = np.clip(cam, 0.0, 1.0)

    cam_im = Image.fromarray((cam * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC)
    cam_im = cam_im.filter(ImageFilter.GaussianBlur(radius=size / 48.0))
    return np.asarray(cam_im, dtype=np.float32) / 255.0


def _overlay(base_slice: np.ndarray, cam: np.ndarray, out_size: int = OUTPUT_SIZE) -> Image.Image:
    base_im = Image.fromarray((np.clip(base_slice, 0, 1) * 255).astype(np.uint8))
    base_im = base_im.resize((out_size, out_size), Image.LANCZOS)
    base_rgb = np.stack([np.asarray(base_im, dtype=np.float32) / 255.0] * 3, axis=-1)

    cam = _prepare_cam(cam, out_size)
    heat_rgb = _apply_colormap(cam)

    alpha = np.clip((cam - ALPHA_FLOOR) / (1.0 - ALPHA_FLOOR), 0.0, 1.0) ** ALPHA_GAMMA
    alpha = (alpha * OVERLAY_MAX_ALPHA)[..., None]
    blended = np.clip(base_rgb * (1 - alpha) + heat_rgb * alpha, 0, 1)
    return Image.fromarray((blended * 255).astype(np.uint8))


def _target_layer(model: torch.nn.Module) -> torch.nn.Module:
    return model.layer4
