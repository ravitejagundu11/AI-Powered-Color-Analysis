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
- **Google Compute Engine** (VM-based)
- **Nginx** for reverse proxy and SSL/TLS
- **Let's Encrypt** for SSL certificates
- **Custom domain** with static IP
- **Systemd** for service management

## 🚀 Deployment to Google Cloud

### Production Deployment (VM)
```
All scripts will be present in scripts folder.
```

```bash
# 1. Configure Google Cloud credentials
export GITHUB_PAT="your_github_personal_access_token"

# 2. Deploy backend
./deploy-vm-cpu.sh

# 3. Deploy frontend
./deploy-frontend-vm.sh

# 4. Configure custom domain with SSL
./setup-domain.sh
```

### Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete VM deployment guide
- **[vm-manage.sh](./vm-manage.sh)** - VM management utilities
- **[update-deployment.sh](./update-deployment.sh)** - Update deployed application

### Live Application

- **Website**: https://color-analysis.me
- **API Docs**: https://color-analysis.me/docs
- **Health Check**: https://color-analysis.me/health

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
├── deploy-vm-cpu.sh                   # Deploy backend to VM
├── deploy-frontend-vm.sh              # Deploy frontend to VM
├── setup-domain.sh                    # Configure domain & SSL
├── update-deployment.sh               # Update running application
├── vm-manage.sh                       # VM management utilities
└── DEPLOYMENT.md                      # VM deployment documentation

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

- **VM (e2-standard-4)**: ~$120/month (24/7 operation)
- **Static IP**: ~$3-4/month
- **SSL Certificate**: Free (Let's Encrypt)
- **Total**: ~$125/month

### Cost Optimization:
- Stop VM when not in use to reduce costs
- Use smaller instance type for lower traffic
- Static IP ensures no DNS changes on restart

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

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.

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
- [VM Deployment Guide](./DEPLOYMENT.md)
- [VM Management Script](./vm-manage.sh)
- [Google Compute Engine Docs](https://cloud.google.com/compute/docs)

---

**Last Updated**: December 2025
**Version**: 2.1.0
**Status**: Production Ready ✅
