# Skin Tone Outfit Recommendation System

This repository contains the complete codebase for a full-stack application that analyzes skin tone from a photo and recommends outfit options based on the detected color palette.

(Tentative information)

## Tech Stack

### Frontend
- **ReactJS**
- **Axios** (for API calls)
- **Tailwind CSS** (for UI styling)

### Backend
- **Flask** or **FastAPI**



## Machine Learning Models

### Model 1: Skin Color Analysis
- **Input**: User-uploaded photo  
- **Output**: Color palette representing dominant skin tones  
- **Model Architecture**: `ResNet18`  
- **Training Datasets**:
  - [MST-E Dataset (Google)](https://skintone.google/mste-dataset)
  - [Skin Tone Classification Dataset (Kaggle)](https://www.kaggle.com/datasets/usamarana/skin-tone-classification-dataset)

### Model 2 / API: Outfit Recommendation
- **Input**: Skin tone color palette or photo  
- **Output**: Suggested outfit images from the Career Closet wardrobe  
- **Functionality**: Matches colors from the detected palette to wardrobe items for optimal style recommendations
