# AI-Powered Color Analysis System

This repository contains a full-stack application that analyzes facial skin tone from photos and recommends personalized seasonal color palettes using machine learning.

## 🎨 Features

- **AI-Powered Skin Tone Analysis**: Uses ResNext50 deep learning model
- **Seasonal Color Palette**: Determines Spring, Summer, Autumn, or Winter color season
- **Personalized Color Recommendations**: Provides primary and secondary color palettes
- **Face Masking**: Advanced preprocessing for accurate skin tone detection
- **Real-time Camera Capture**: Take photos directly in the browser
- **Image Upload**: Support for uploaded images
- **Interactive UI**: Modern, responsive React interface

## 🏗️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast builds
- **Lucide React** for icons
- **Modern CSS** with responsive design

### Backend
- **FastAPI** (Python 3.10+)
- **PyTorch 2.0** for ML inference
- **ResNext50** CNN architecture
- **Uvicorn** ASGI server
- **Face masking** with facer library

### Deployment
- **Google Cloud Run** (serverless containers)
- **Docker** containerization
- **Nginx** for frontend serving
- **Artifact Registry** for image storage

## 🚀 Deployment to Google Cloud

### Quick Deploy (Recommended)

```bash
# 1. Install Google Cloud CLI
brew install --cask google-cloud-sdk

# 2. Login and setup project
gcloud auth login
export PROJECT_ID="color-analysis-app"
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID

# 3. Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com

# 4. Run deployment script
./deploy.sh
```

### Documentation

- **[GOOGLE_CLOUD_DEPLOYMENT.md](./GOOGLE_CLOUD_DEPLOYMENT.md)** - Complete deployment guide (14 pages)
- **[DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)** - Quick reference and commands
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Overview of all changes and files

## 💻 Local Development

### Backend Setup

```bash
cd back-end

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn color_analysis_api:app --reload
```

Backend will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend Setup

```bash
cd front-end/Color-Analysis

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 🤖 Machine Learning Model

### Model Architecture
- **Base Model**: ResNext50 (pretrained on ImageNet)
- **Custom Layers**: Fine-tuned for seasonal color classification
- **Input**: 224x224 RGB images
- **Output**: 4-class classification (Spring, Summer, Autumn, Winter)
- **Preprocessing**: Face masking to focus on skin tone

### Training Details
- **Model Location**: `models/ResNext50/best_model_resnext50_rgbm.pth`
- **Training Notebooks**: Available in `models/ResNext50/`
- **Performance**: See model-specific README files

### Color Palette System
- **Palette Data**: `back-end/color_palette_v2.json`
- **Primary Colors**: 20 colors per season
- **Secondary Colors**: 15 complementary colors per season
- **Characteristics**: Detailed descriptions for each season

## 📁 Project Structure

```
AI-Powered-Color-Analysis/
├── back-end/                          # FastAPI backend
│   ├── color_analysis_api.py          # Main API application
│   ├── color_recommendation_engine.py # Color matching logic
│   ├── face_masking_preprocessor.py   # Image preprocessing
│   ├── constants.py                   # Configuration
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Docker configuration
│   └── cloudbuild.yaml                # CI/CD configuration
├── front-end/Color-Analysis/          # React frontend
│   ├── src/
│   │   ├── App.tsx                    # Main app component
│   │   ├── components/                # React components
│   │   └── types/                     # TypeScript types
│   ├── Dockerfile                     # Docker configuration
│   ├── nginx.conf                     # Nginx configuration
│   └── cloudbuild.yaml                # CI/CD configuration
├── models/                            # ML models directory
│   ├── ResNext50/                     # Current production model
│   ├── DenseNet/                      # Alternative model
│   ├── EfficientNetB0/                # Alternative model
│   └── ResNet34/                      # Alternative model
├── deploy.sh                          # Automated deployment script
├── GOOGLE_CLOUD_DEPLOYMENT.md         # Complete deployment guide
├── DEPLOYMENT_QUICKSTART.md           # Quick reference
└── DEPLOYMENT_SUMMARY.md              # Changes summary

```

## 🔧 Environment Variables

### Backend (.env)
```bash
MODEL_PATH=models/ResNext50/best_model_resnext50_rgbm.pth
COLOR_PALETTE_PATH=color_palette_v2.json
PORT=8080
ALLOWED_ORIGINS=*  # Update for production
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000
```

## 🧪 Testing

### Test Backend
```bash
# Health check
curl http://localhost:8000/health

# Interactive API docs
open http://localhost:8000/docs
```

### Test Frontend
1. Open `http://localhost:5173`
2. Allow camera access (or upload image)
3. Capture/upload photo
4. View color analysis results

## 📊 API Endpoints

### GET `/health`
Check API and model status

### POST `/analyze-color`
Analyze image and return color palette
- **Input**: Multipart form with image file
- **Output**: JSON with season, palette, confidence

### GET `/docs`
Interactive API documentation (Swagger UI)

## 💰 Cost Estimates (Google Cloud)

- **Development**: $0-5/month (free tier)
- **Low Traffic**: $10-20/month
- **Medium Traffic**: $30-50/month
- **High Traffic**: $100+/month

### Free Tier Includes:
- 2 million requests/month
- 360,000 GB-seconds memory
- 180,000 vCPU-seconds

## 🔒 Security

- CORS configured for specific origins
- Image validation (type and size)
- HTTPS by default on Cloud Run
- No sensitive data stored
- Stateless architecture

## 📈 Performance

- **Backend Cold Start**: 5-10 seconds
- **Analysis Time**: 2-3 seconds
- **Frontend Load**: <1 second
- **Auto-scaling**: 0-10 instances

## 🛠️ Troubleshooting

### Backend Issues
```bash
# View logs
gcloud run services logs read color-analysis-backend --limit 50

# Increase memory if needed
gcloud run services update color-analysis-backend --memory 4Gi
```

### Frontend Issues
```bash
# Rebuild with correct API URL
cd front-end/Color-Analysis
echo "VITE_API_BASE_URL=YOUR_BACKEND_URL" > .env.production
npm run build
```

See [GOOGLE_CLOUD_DEPLOYMENT.md](./GOOGLE_CLOUD_DEPLOYMENT.md) for detailed troubleshooting.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

See LICENSE file for details.

## 🙏 Acknowledgments

- **Training Datasets**:
  - [MST-E Dataset (Google)](https://skintone.google/mste-dataset)
  - [Skin Tone Classification Dataset (Kaggle)](https://www.kaggle.com/datasets/usamarana/skin-tone-classification-dataset)
- **Libraries**: PyTorch, FastAPI, React, facer
- **Cloud Platform**: Google Cloud Run

## 📞 Support

For deployment help, see:
- [Complete Deployment Guide](./GOOGLE_CLOUD_DEPLOYMENT.md)
- [Quick Start Guide](./DEPLOYMENT_QUICKSTART.md)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)

---

**Last Updated**: December 2025
**Version**: 2.1.0
**Status**: Production Ready ✅
