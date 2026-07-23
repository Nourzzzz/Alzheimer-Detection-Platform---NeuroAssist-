import logging

import torch.nn as nn
import torchvision.models as models

from app.config import CLASSES_2D, CNN_2D_BACKBONE

logger = logging.getLogger(__name__)

DROPOUT_P = 0.4


def build_model_2d(pretrained: bool = True, backbone: str = None, num_classes: int = None,
                    freeze_backbone: bool = False) -> nn.Module:
    backbone = backbone or CNN_2D_BACKBONE
    num_classes = num_classes or len(CLASSES_2D)

    if backbone == "resnet18":
        model, weights_enum = models.resnet18(weights=None), models.ResNet18_Weights.DEFAULT
    elif backbone == "resnet50":
        model, weights_enum = models.resnet50(weights=None), models.ResNet50_Weights.DEFAULT
    else:
        raise ValueError(f"Unknown 2D backbone {backbone!r}, expected resnet18 or resnet50")

    if pretrained:
        from app.cnn.weights import get_torchvision_weights

        state_dict = get_torchvision_weights(weights_enum)
        model.load_state_dict(state_dict, strict=True)
        logger.info("Loaded pretrained ImageNet weights for %s", backbone)

    if pretrained and freeze_backbone:
        for name, param in model.named_parameters():
            if not name.startswith(("layer4", "fc")):
                param.requires_grad = False

    model.fc = nn.Sequential(
        nn.Dropout(p=DROPOUT_P),
        nn.Linear(model.fc.in_features, num_classes),
    )
    return model
