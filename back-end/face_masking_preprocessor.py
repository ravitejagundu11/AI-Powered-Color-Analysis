# face_masking_preprocessor.py
"""
Face Masking Preprocessor using Facer
Crops face + hair region, excluding neck, shoulders, and body
NO OpenCV dependency - uses Pillow + NumPy only
"""

import numpy as np
from PIL import Image, ImageOps
import torch
from typing import Tuple, Optional
import io


class FaceMaskingPreprocessor:
    """
    Precise face + hair cropping using Facer toolbox.
    Cuts at chin level - NO neck, NO body, NO shoulders, NO outfit.
    
    Class indices:
    - Class 2: Face skin
    - Classes 4-13: Facial parts (eyebrows, eyes, nose, lips, mouth, ears)
    - Class 14: Hair
    - EXCLUDED: Class 3 (shoulders/body), Classes 15+ (outfit/neck/body)
    """
    
    def __init__(self, device: str = 'cpu'):
        """
        Initialize the face masking preprocessor
        
        Args:
            device: 'cpu' or 'cuda'
        """
        self.device = torch.device(device)
        self.face_detector = None
        self.face_parser = None
        self._load_models()
        
        print(f"FaceMaskingPreprocessor initialized on device: {self.device}")
    
    def _load_models(self):
        """Load Facer models for face detection and parsing"""
        try:
            import facer
            
            print("Loading Facer models...")
            
            # Load face detector
            try:
                self.face_detector = facer.face_detector('retinaface/mobilenet', device=self.device)
                print("Face detector loaded: retinaface/mobilenet")
            except Exception as e:
                print(f"Failed to load mobilenet, trying resnet50: {e}")
                self.face_detector = facer.face_detector('retinaface/resnet50', device=self.device)
                print("Face detector loaded: retinaface/resnet50")
            
            # Load face parser
            try:
                self.face_parser = facer.face_parser('farl/celebm/448', device=self.device)
                print("Face parser loaded: farl/celebm/448")
            except Exception as e:
                print(f"Failed to load celebm, trying lapa: {e}")
                try:
                    self.face_parser = facer.face_parser('farl/lapa/448', device=self.device)
                    print("Face parser loaded: farl/lapa/448")
                except Exception as e2:
                    print(f"Failed to load face parser: {e2}")
                    raise RuntimeError("Could not load face parser model")
            
        except ImportError:
            raise ImportError(
                "Facer is not installed. Install it with: "
                "pip install git+https://github.com/FacePerceiver/facer.git@main"
            )
    
    def process_image(
        self, 
        image_input: bytes, 
        output_size: Tuple[int, int] = (224, 224)
    ) -> Tuple[Image.Image, Optional[np.ndarray]]:
        """
        Process image to extract face + hair region
        
        Args:
            image_input: Image bytes
            output_size: Output image size (width, height)
            
        Returns:
            Tuple of (masked_face_pil, mask_array)
        """
        # Convert bytes to PIL Image (replaces cv2.imdecode)
        pil_image = Image.open(io.BytesIO(image_input))
        
        # Convert to RGB if needed
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Convert PIL to numpy array (RGB format)
        image_rgb = np.array(pil_image)
        image_height, image_width, _ = image_rgb.shape
        
        print(f"Processing image: {image_width}x{image_height}")
        
        # Prepare image for Facer (must be uint8)
        image_tensor = torch.tensor(
            image_rgb, 
            dtype=torch.uint8
        ).permute(2, 0, 1).unsqueeze(0).to(self.device)
        
        # Face Detection
        print("Detecting faces...")
        with torch.inference_mode():
            batch_dicts = self.face_detector(image_tensor)
        
        if not batch_dicts or len(batch_dicts) == 0:
            print("No faces detected! Returning original image")
            return pil_image, None
        
        batch_dict = batch_dicts[0] if isinstance(batch_dicts, list) else batch_dicts
        print("Face(s) detected")
        
        # Face Parsing (Segmentation)
        print("Parsing face (segmentation)...")
        with torch.inference_mode():
            batch_dicts = self.face_parser(image_tensor, batch_dicts)
        
        batch_dict = batch_dicts[0] if isinstance(batch_dicts, list) else batch_dicts
        
        if not isinstance(batch_dict, dict) or 'seg' not in batch_dict:
            print("No segmentation output! Returning original image")
            return pil_image, None
        
        # Extract segmentation masks
        seg_logits = batch_dict['seg']['logits']  # (1, num_classes, H, W)
        seg_probs = seg_logits.softmax(dim=1)
        seg_pred = seg_probs.argmax(dim=1)  # (1, H, W)
        
        n_classes = seg_probs.shape[1]
        seg_pred_np = seg_pred[0].cpu().numpy()
        
        print(f"Segmentation classes: {n_classes}")
        
        # Create face + hair mask
        merged_mask = self._create_face_hair_mask(seg_pred_np, n_classes)
        
        # Get chin position from landmarks
        chin_y = self._get_chin_position(batch_dict, image_height)
        
        # Determine crop boundaries
        cropped_face, mask_resized = self._crop_and_resize(
            image_rgb, 
            merged_mask, 
            chin_y, 
            image_width, 
            image_height, 
            output_size
        )
        
        return cropped_face, mask_resized
    
    def _create_face_hair_mask(self, seg_pred_np: np.ndarray, n_classes: int) -> np.ndarray:
        """
        Create mask including face skin, facial parts, and hair
        Excludes shoulders, body, and outfit
        """
        merged_mask = np.zeros_like(seg_pred_np, dtype=np.uint8)
        
        # Include face skin (class 2)
        merged_mask[seg_pred_np == 2] = 255
        print("Included: Class 2 (face skin)")
        
        # Include facial parts (classes 4-13) - SKIP class 3!
        for cls in range(4, 14):
            merged_mask[seg_pred_np == cls] = 255
        print("Included: Classes 4-13 (facial features)")
        
        # Include hair (class 14)
        merged_mask[seg_pred_np == 14] = 255
        print("Included: Class 14 (hair)")
        
        # Explicitly exclude class 3 (shoulders/body)
        merged_mask[seg_pred_np == 3] = 0
        print("Excluded: Class 3 (shoulders/body)")
        
        # Explicitly exclude outfit classes (15+)
        for cls in range(15, n_classes):
            merged_mask[seg_pred_np == cls] = 0
        print(f"Excluded: Classes 15-{n_classes-1} (outfit/neck/body)")
        
        print(f"Final mask pixels: {np.sum(merged_mask > 0)}")
        
        return merged_mask
    
    def _get_chin_position(self, batch_dict: dict, image_height: int) -> int:
        """Extract chin Y position from landmarks"""
        landmarks = batch_dict.get('landmarks', None)
        chin_y = image_height
        
        if landmarks is not None:
            try:
                landmarks_np = landmarks.cpu().numpy()
                if len(landmarks_np) > 0:
                    face_landmarks = landmarks_np[0]
                    chin_y = int(np.max(face_landmarks[:, 1]))
                    print(f"Chin Y position: {chin_y}")
            except Exception as e:
                print(f"Could not extract chin position: {e}")
        
        return chin_y
    
    def _crop_and_resize(
        self, 
        image_rgb: np.ndarray, 
        merged_mask: np.ndarray, 
        chin_y: int,
        image_width: int,
        image_height: int,
        output_size: Tuple[int, int]
    ) -> Tuple[Image.Image, np.ndarray]:
        """Crop face region and resize to output size"""
        coords = np.where(merged_mask > 0)
        
        if len(coords[0]) == 0:
            print("No mask pixels found! Returning original image")
            pil_image = Image.fromarray(image_rgb)
            pil_image = pil_image.resize(output_size, Image.Resampling.LANCZOS)
            return pil_image, np.ones(output_size, dtype=np.uint8) * 255
        
        y_min = np.min(coords[0])
        y_max = np.max(coords[0])
        x_min = np.min(coords[1])
        x_max = np.max(coords[1])
        
        # Limit y_max to chin level
        y_max = min(y_max, chin_y)
        
        # Add side margins (10%)
        margin_x = int((x_max - x_min) * 0.1)
        crop_x1 = max(0, x_min - margin_x)
        crop_x2 = min(image_width, x_max + margin_x)
        crop_y1 = max(0, y_min)
        crop_y2 = min(image_height, y_max)
        
        print(f"Crop bounds: x[{crop_x1}:{crop_x2}], y[{crop_y1}:{crop_y2}]")
        
        # Crop image and mask using numpy slicing
        face_crop_rgb = image_rgb[crop_y1:crop_y2, crop_x1:crop_x2]
        merged_mask_crop = merged_mask[crop_y1:crop_y2, crop_x1:crop_x2]
        
        # Resize using PIL (replaces cv2.resize)
        pil_crop = Image.fromarray(face_crop_rgb)
        pil_crop_resized = pil_crop.resize(output_size, Image.Resampling.LANCZOS)
        face_crop_resized = np.array(pil_crop_resized)
        
        # Resize mask using PIL nearest neighbor (replaces cv2.INTER_NEAREST)
        pil_mask = Image.fromarray(merged_mask_crop)
        pil_mask_resized = pil_mask.resize(output_size, Image.Resampling.NEAREST)
        mask_resized = np.array(pil_mask_resized)
        
        # Apply mask
        print("Applying mask...")
        black_background = np.zeros((output_size[1], output_size[0], 3), dtype=np.uint8)
        mask_3ch = np.stack((mask_resized,) * 3, axis=-1)
        
        masked_face = np.where(
            mask_3ch > 127,
            face_crop_resized,
            black_background
        ).astype(np.uint8)
        
        # Convert to PIL
        cropped_pil = Image.fromarray(masked_face)
        
        print("Face masking complete!")
        
        return cropped_pil, mask_resized


# Singleton instance for reuse
_preprocessor_instance: Optional[FaceMaskingPreprocessor] = None


def get_face_masking_preprocessor(device: str = 'cpu') -> FaceMaskingPreprocessor:
    """Get or create singleton instance of FaceMaskingPreprocessor"""
    global _preprocessor_instance
    
    if _preprocessor_instance is None:
        _preprocessor_instance = FaceMaskingPreprocessor(device=device)
    
    return _preprocessor_instance

