import io
import os
from typing import Dict, List, Any, Optional, Tuple
import logging
from collections import OrderedDict

# Ensure logging is configured early
logging.basicConfig(level=logging.DEBUG)

# PyTorch and ML/Image Imports
import torch
import torch.nn as nn
import numpy as np
from PIL import Image




from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from torchvision import transforms
from torchvision.models import resnext50_32x4d, ResNeXt50_32X4D_Weights
from constants import MODEL_PATH, COLOR_PALETTE_PATH
from pymongo import MongoClient
from bson.objectid import ObjectId
from rembg import remove
from colorthief import ColorThief
from dotenv import load_dotenv
import os
import gridfs
import base64



# Import our custom modules
from color_recommendation_engine import ColorRecommendationEngineV2
from face_masking_preprocessor import get_face_masking_preprocessor

load_dotenv()   # loads everything from .env - MUST be called before reading env vars
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["color_analysis"]
photos_collection = db["photos"]

# DB references
color_similarity_collection = db["color_similarity"]



# Initialize the FastAPI application
app = FastAPI(
    title="Personal Color Analysis API with Face Masking",
    description="Accepts an image, applies face masking, and returns personalized seasonal color palette.",
    version="2.1.0"
)

# Add CORS middleware
# In production, restrict origins to your frontend domain
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- GLOBAL CONFIGURATION ---
ML_MODEL = None 
COLOR_ENGINE = None
FACE_PREPROCESSOR = None 
IMG_SIZE = (224, 224) 
DEVICE = torch.device("cpu")
USE_FACE_MASKING = True  
# ----------------------------

# --- PYTORCH MODEL ARCHITECTURE ---
class ColorAnalysisModel(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        self.base_model = resnext50_32x4d(weights=ResNeXt50_32X4D_Weights.IMAGENET1K_V1)
        num_ftrs = self.base_model.fc.in_features
        self.base_model.fc = nn.Linear(num_ftrs, num_classes)

    def forward(self, x):
        return self.base_model(x)


# --- ENHANCED DATA MODELS (Pydantic) ---
class Color(BaseModel):
    name: str
    hex: str
    rgb: Optional[List[int]] = None


class Palette(BaseModel):
    primary: List[Color]
    secondary: List[Color]


class SeasonalAnalysis(BaseModel):
    primary_season: str
    primary_score: float
    secondary_season: str
    secondary_score: float
    all_scores: Dict[str, float]


class SeasonDescription(BaseModel):
    name: str
    code: str
    description: str
    characteristics: Dict[str, str]
    hair_colors: List[str]
    makeup_recommendations: Dict[str, List[str]]
    avoid_colors: List[Color]


class RecommendedColor(BaseModel):
    name: str
    hex: str
    rgb: List[int]
    season: str
    fit_score: float
    use_for: List[str]
    confidence_multiplier: float


class AnalysisResult(BaseModel):
    season: str
    confidence: float = Field(..., description="Prediction confidence (0-1)")
    palettes: Palette
    all_probabilities: Dict[str, float] = Field(..., description="All season probabilities")
    description: Optional[SeasonDescription] = None
    face_masking_applied: bool = Field(False, description="Whether face masking was applied")


class DetailedAnalysisResult(BaseModel):
    season: str
    confidence: float
    palettes: Palette
    seasonal_analysis: SeasonalAnalysis
    recommended_colors: List[RecommendedColor]
    description: SeasonDescription
    face_masking_applied: bool = False


def fix_state_dict_keys(state_dict, model_has_base_model=True):
    """Fix state_dict keys to match the model architecture"""
    new_state_dict = OrderedDict()
    
    for key, value in state_dict.items():
        new_key = key
        
        if new_key.startswith('module.'):
            new_key = new_key.replace('module.', '')
        
        if model_has_base_model:
            if not new_key.startswith('base_model.'):
                new_key = 'base_model.' + new_key
        else:
            if new_key.startswith('base_model.'):
                new_key = new_key.replace('base_model.', '')
        
        new_state_dict[new_key] = value
    
    return new_state_dict


@app.on_event("startup")
async def load_resources_on_startup():
    """Load all models on startup"""
    global ML_MODEL, COLOR_ENGINE, FACE_PREPROCESSOR
    
    # Load ML Model
    try:
        if not os.path.exists(MODEL_PATH):
            print(f"Model file not found at {MODEL_PATH}")
            return
        
        print(f"Loading ML model from {MODEL_PATH}...")
        
        model = ColorAnalysisModel(num_classes=4)
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
        
        if isinstance(checkpoint, dict):
            if 'state_dict' in checkpoint:
                state_dict = checkpoint['state_dict']
            elif 'model_state_dict' in checkpoint:
                state_dict = checkpoint['model_state_dict']
            else:
                state_dict = checkpoint
        else:
            state_dict = checkpoint
        
        state_dict = fix_state_dict_keys(state_dict, model_has_base_model=True)
        model.load_state_dict(state_dict, strict=True)
        model.eval()
        model = model.to(DEVICE)
        
        ML_MODEL = model
        print(f"PyTorch Model loaded successfully!")
        
    except Exception as e:
        print(f"ERROR loading PyTorch model: {e}")
        import traceback
        traceback.print_exc()
    
    # Load Color Recommendation Engine
    try:
        if not os.path.exists(COLOR_PALETTE_PATH):
            print(f"Color palette file not found at {COLOR_PALETTE_PATH}")
            return
        
        print(f"Loading Color Recommendation Engine...")
        COLOR_ENGINE = ColorRecommendationEngineV2(COLOR_PALETTE_PATH)
        
    except Exception as e:
        print(f"ERROR loading Color Recommendation Engine: {e}")
        import traceback
        traceback.print_exc()
    
    # Load Face Masking Preprocessor
    if USE_FACE_MASKING:
        try:
            print(f"Loading Face Masking Preprocessor...")
            # Note: This will fail if facer dependencies are not installed, 
            # and FACE_PREPROCESSOR will remain None.
            FACE_PREPROCESSOR = get_face_masking_preprocessor(device=str(DEVICE))
            
        except Exception as e:
            print(f"WARNING: Face masking preprocessor failed to load: {e}")
            print("   Continuing without face masking...")
            import traceback
            traceback.print_exc()


# --- Preprocessing Pipeline ---
preprocess = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]), 
])


# --- NEW: Refactored Image Processing Helper (Masking logic removed) ---
def _process_image_for_model(image_data: bytes, apply_face_masking: bool = True) -> Tuple[Image.Image, bool]:
    """
    Handles all image loading, face masking, and resizing.
    
    Returns:
        Tuple of (processed_pil_image, masking_applied)
    """
    masking_applied = False
    
    try:
        pil_image = Image.open(io.BytesIO(image_data))
        if pil_image.mode != 'RGB':
            logging.info(f"Converting image from {pil_image.mode} to RGB")
            pil_image = pil_image.convert('RGB')
        logging.info(f"Image loaded successfully: {pil_image.size}")
    except Exception as e:
        logging.error(f"Failed to load image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # Apply face masking if enabled and preprocessor is available
    if apply_face_masking and FACE_PREPROCESSOR is not None:
        try:
            logging.info("Applying face masking preprocessing...")
            # FACE_PREPROCESSOR.process_image returns the masked/cropped PIL image at IMG_SIZE
            processed_pil_image, _ = FACE_PREPROCESSOR.process_image(image_data, output_size=IMG_SIZE)
            masking_applied = True
            logging.info("Face masking applied successfully")
            return processed_pil_image, masking_applied
        except Exception as e:
            # Fall back to resized original image on failure
            logging.warning(f"Face masking failed: {str(e)}, using resized original image")
            # Fall through to standard resizing
    
    # Standard resize if masking is disabled, preprocessor failed to load, or masking failed
    logging.info("Resizing original image to model input size.")
    processed_pil_image = pil_image.resize(IMG_SIZE, Image.Resampling.LANCZOS)
    
    return processed_pil_image, masking_applied


def analyze_image_tone(image_data: bytes, apply_face_masking: bool = True) -> tuple[str, float, Dict[str, float], np.ndarray, bool, Image.Image]:
    """
    Analyzes the image using the loaded PyTorch model
    
    Returns:
        Tuple of (season_name, confidence, all_probabilities, raw_predictions, masking_applied, processed_pil_image)
    """
    if ML_MODEL is None:
        raise HTTPException(status_code=503, detail="ML Model not initialized.")

    try:
        processed_pil_image, masking_applied = _process_image_for_model(image_data, apply_face_masking)
        
        # Preprocess for PyTorch
        input_tensor = preprocess(processed_pil_image)
        input_batch = input_tensor.unsqueeze(0).to(DEVICE)
        
        # Run inference
        with torch.no_grad():
            output = ML_MODEL(input_batch)
        
        probabilities = torch.nn.functional.softmax(output, dim=1)
        predicted_index = torch.argmax(probabilities, dim=1).item()
        
        # Map to seasons: [Autumn, Summer, Winter, Spring]
        SEASON_LABELS = ['Autumn', 'Summer', 'Winter', 'Spring']
        season_name = SEASON_LABELS[predicted_index]
        confidence = probabilities[0, predicted_index].item()
        
        all_probs = {
            season: probabilities[0, idx].item() 
            for idx, season in enumerate(SEASON_LABELS)
        }
        
        raw_predictions = probabilities[0].cpu().numpy()
        
        print(f"Prediction: {season_name} (Confidence: {confidence:.2%})")
        
        return season_name, confidence, all_probs, raw_predictions, masking_applied, processed_pil_image
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Image analysis error: {e}")
        import traceback
        traceback.print_exc()
        # Raise generic 400 error if it wasn't already an HTTPException
        raise HTTPException(status_code=400, detail=f"Image analysis failed: {str(e)}")


# --- API ENDPOINTS ---

@app.post(
    "/analyze-color",
    response_model=AnalysisResult,
    summary="Analyze image for personal color season",
    description="Uploads a photo for seasonal color analysis with optional face masking."
)
async def analyze_color_endpoint(
    image: UploadFile = File(..., description="The image to analyze."),
    include_description: bool = Query(False, description="Include detailed season description"),
    apply_face_masking: bool = Query(True, description="Apply face masking preprocessing")
) -> AnalysisResult:
    """Basic color analysis endpoint with optional face masking"""
    try:
        logging.info(f"Received image for analysis: {image.filename}, content_type: {image.content_type}")
        
        if image.content_type and not image.content_type.startswith('image/'):
            logging.error(f"Invalid content type: {image.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_bytes = await image.read()
        
        max_size = 10 * 1024 * 1024  # 10MB
        if len(image_bytes) > max_size:
            file_size_mb = len(image_bytes) / (1024 * 1024)
            logging.error(f"File too large: {file_size_mb:.2f}MB (max 10MB)")
            raise HTTPException(status_code=413, detail=f"File too large ({file_size_mb:.2f}MB). Maximum size is 10MB. Please compress your image.")
        
        if len(image_bytes) == 0:
            logging.error("Empty file uploaded")
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        logging.info(f"Image size: {len(image_bytes)} bytes, starting analysis...")
        
        # Analyze the image (image is discarded here)
        season, confidence, all_probs, _, masking_applied, _ = analyze_image_tone(image_bytes, apply_face_masking)
        
        logging.info(f"Analysis complete: {season} ({confidence:.2%})")
        
        # Get palette from color engine using weighted method for personalization
        if COLOR_ENGINE:
            palette_data = COLOR_ENGINE.get_weighted_palette_for_probabilities(all_probs)
        else:
            logging.error("Color Engine not initialized")
            raise HTTPException(status_code=503, detail="Color Engine not initialized")
        
        result = AnalysisResult(
            season=season,
            confidence=round(confidence, 4),
            palettes=Palette(**palette_data),
            all_probabilities=all_probs,
            face_masking_applied=masking_applied
        )
        
        if include_description and COLOR_ENGINE:
            # Assuming get_season_description returns a dict compatible with SeasonDescription
            result.description = SeasonDescription(**COLOR_ENGINE.get_season_description(season))
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in analyze_color_endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# --- NEW DEBUG ENDPOINT ---
@app.post(
    "/analyze-debug-masked-image",
    summary="Returns the processed image after face masking/cropping.",
    description="Uploads a photo and returns the exact 224x224 image (as JPEG) that is sent to the ML model. Gracefully falls back to unmasked/resized if masking fails."
)
async def analyze_debug_masked_image_endpoint(
    image: UploadFile = File(..., description="The image to analyze."),
    apply_face_masking: bool = Query(True, description="Apply face masking preprocessing (set to False to see the unmasked, resized input)")
):
    """Debug endpoint to return the preprocessed image for inspection"""
    try:
        if image.content_type and not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_bytes = await image.read()
        
        max_size = 10 * 1024 * 1024  # 10MB
        if len(image_bytes) > max_size:
            file_size_mb = len(image_bytes) / (1024 * 1024)
            raise HTTPException(status_code=413, detail=f"File too large ({file_size_mb:.2f}MB). Maximum size is 10MB. Please compress your image.")
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # --- Use the robust processing helper function ---
        pil_image, masking_applied = _process_image_for_model(image_bytes, apply_face_masking)

        # Convert PIL image to bytes
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='JPEG', quality=95) # Use high quality for debugging
        img_byte_arr.seek(0)

        print(f"Debug image returned: Masking applied={masking_applied}")

        # Stream the image back, including the debug header
        return StreamingResponse(img_byte_arr, media_type="image/jpeg", 
                                 headers={"X-Face-Masking-Applied": str(masking_applied)})
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in analyze_debug_masked_image_endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/health")
async def health_check():
    """Check if the API and model are ready"""
    return {
        "status": "healthy" if (ML_MODEL is not None and COLOR_ENGINE is not None) else "partially_loaded",
        "model_loaded": ML_MODEL is not None,
        "color_engine_loaded": COLOR_ENGINE is not None,
        "face_preprocessor_loaded": FACE_PREPROCESSOR is not None,
        "face_masking_enabled": USE_FACE_MASKING,
        "device": str(DEVICE),
        "num_classes": 4
    }


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Personal Color Analysis API with Face Masking v2.1",
        "version": "2.1.1",
        "endpoints": {
            "health": "/health",
            "analyze_basic": "/analyze-color",
            "analyze_debug_image": "/analyze-debug-masked-image", # Added debug endpoint
            "docs": "/docs"
        },
        "features": [
            "ML-powered season detection",
            "Robust face masking (if dependencies install)",
            "Personalized color recommendations",
        ]
    }


def extract_colors_with_percentage(image_bytes: bytes, color_count: int = 5) -> Dict[str, Dict[str, Any]]:
    """
    Extracts dominant colors and estimates percentage for each one.
    Returns:
        {
            "1": {"color": "#rrggbb", "percentage": int},
            "2": {"color": "#rrggbb", "percentage": int},
            ...
        }
    """

    # Load image
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_small = img.resize((150, 150))   # shrink for faster pixel stats
    pixels = np.array(img_small).reshape(-1, 3)

    # Use ColorThief for palette
    ct = ColorThief(io.BytesIO(image_bytes))
    palette = ct.get_palette(color_count=color_count)

    # For each palette color → percentage of closest pixels
    percentages = []
    for color in palette:
        diff = np.linalg.norm(pixels - np.array(color), axis=1)
        closest = diff <= np.min(diff) + 25   # tolerance so clusters aren't too tiny
        pct = int((np.sum(closest) / len(pixels)) * 100)
        percentages.append(pct)

    # Normalize to sum=100 (rounding safety)
    total = sum(percentages)
    if total > 0:
        percentages = [int((p / total) * 100) for p in percentages]

    # Build required JSON structure
    result = {}
    for i, (rgb, pct) in enumerate(zip(palette, percentages), start=1):
        hex_color = "#{:02x}{:02x}{:02x}".format(*rgb)
        result[str(i)] = {
            "color": hex_color,
            "percentage": pct
        }

    return result



def save_photo_data(photo_url: str, colors_sorted: list, is_available: bool, gender: str):
    doc = {
        "photo_url": photo_url,
        "colors_sorted": colors_sorted,
        "is_available": is_available,
        "gender": gender
    }
    result = photos_collection.insert_one(doc)
    return str(result.inserted_id)

@app.post("/upload-image-process-store")
async def upload_image_process_store(
    image: UploadFile = File(...),
    gender: str = "female",
    is_available: bool = True
):
    try:
        img_bytes = await image.read()
        if len(img_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        # Remove background
        bg_removed_bytes = remove(img_bytes)

        # Extract colors WITH percentage
        color_json = extract_colors_with_percentage(bg_removed_bytes)

        # Save to DB
        doc_id = save_photo_data(
            photo_url="uploaded_via_api",
            colors_sorted=color_json,
            is_available=is_available,
            gender=gender
        )

        return {
            "status": "success",
            "document_id": doc_id,
            "colors": color_json
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



fs = gridfs.GridFS(db)
@app.get("/get-image-by-docid")
async def get_image_by_docid(doc_id: str = Query(..., description="MongoDB document _id")):
    """
    Returns the image stored in GridFS for the given document _id.
    The frontend can display it directly with an <img> tag.
    """
    try:
        # Convert string to ObjectId
        try:
            object_id = ObjectId(doc_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid document _id format")

        # Fetch the document
        doc = photos_collection.find_one({"_id": object_id})
        if not doc or "image_gridfs" not in doc:
            raise HTTPException(status_code=404, detail="Document not found or no image in GridFS")

        # Fetch the image from GridFS
        file_id = doc["image_gridfs"]
        grid_out = fs.get(file_id)
        image_bytes = grid_out.read()

        # Stream the image
        return StreamingResponse(io.BytesIO(image_bytes), media_type="image/jpeg")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/get-image-from-base64")
async def get_image_from_base64(doc_id: str = Query(..., description="MongoDB document _id")):
    """
    Returns the image stored in the `image_base64` column for the given document _id.
    The frontend can display it directly with an <img> tag.
    """
    try:
        # Convert string to ObjectId
        try:
            object_id = ObjectId(doc_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid document _id format")

        # Fetch the document
        doc = photos_collection.find_one({"_id": object_id})
        if not doc or "image_base64" not in doc:
            raise HTTPException(status_code=404, detail="Document not found or no Base64 image")

        # Decode the Base64 string
        try:
            image_bytes = base64.b64decode(doc["image_base64"])
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to decode Base64 image")

        # Stream the image
        return StreamingResponse(io.BytesIO(image_bytes), media_type="image/jpeg")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
from fastapi import APIRouter

router = APIRouter()


def _normalize_hex(value: Any) -> str:
    """
    Normalize hex strings to a consistent format: '#rrggbb' lowercase.
    Handles:
      - None
      - strings with/without '#'
      - strings with spaces
    """
    if value is None:
        return ""
    s = str(value).strip()
    if not s:
        return ""
    if s.startswith("#"):
        s = s[1:]
    # some safety: keep only first 6 chars
    s = s[:6]
    return f"#{s.lower()}"

def serialize_mongo_doc(doc):
    doc = dict(doc)  # make a copy
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc

@app.post("/get-matching-clothes")
async def get_matching_clothes(
    primary_colors: List[str],
    gender: Optional[str] = Query(None)
):
    """
    Accepts RAW LIST input:
        ["#808000", "#123456"]

    Returns READY image URLs:
        {
            "matched_count": 8,
            "images": [
                "http://localhost:8000/get-image-by-docid?doc_id=6931c6f7cd874aa7be0f026a",
                "http://localhost:8000/get-image-by-docid?doc_id=6931c81ccd874aa7be0f028c",
                ...
            ]
        }
    """

    try:
        similar_set = set()

        # --- STEP 1: Load similar colors ---
        for color in primary_colors:
            norm_color = _normalize_hex(color)

            doc = (
                color_similarity_collection.find_one({"primary_color": color})
                or color_similarity_collection.find_one({"primary_color": norm_color})
                or color_similarity_collection.find_one({"primary_color": color.lower()})
            )

            if doc and "similar_colors" in doc:
                for similar in doc["similar_colors"]:
                    raw_hex = similar.get("hex") if isinstance(similar, dict) else similar
                    similar_set.add(_normalize_hex(raw_hex))

        all_similar_colors = sorted(similar_set)

        # --- STEP 2: Find matching clothes ---
        image_urls = []

        query = {}
        if gender:
            query["gender"] = gender.lower()

        for cloth in photos_collection.find(query):
            raw_top2 = cloth.get("top2_colors")
            if not raw_top2:
                continue

            normalized = [
                _normalize_hex(x) if isinstance(x, str)
                else _normalize_hex(x.get("hex"))
                for x in raw_top2
            ]

            if any(c in all_similar_colors for c in normalized):
                # Build image URL
                image_url = f"{API_BASE_URL}/get-image-by-docid?doc_id={cloth['_id']}"
                image_urls.append(image_url)

        return {
            "matched_count": len(image_urls),
            "images": image_urls
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
