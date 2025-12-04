import os

# Support both local development and production (Docker) paths
MODEL_PATH = os.environ.get("MODEL_PATH", "../models/ResNext50/best_model_resnext50_rgbm.pth")
COLOR_PALETTE_PATH = os.environ.get("COLOR_PALETTE_PATH", "color_palette_v2.json")