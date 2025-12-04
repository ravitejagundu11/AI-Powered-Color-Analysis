# AI-Powered Color Analysis - Deployment Guide

This guide covers the complete deployment of the AI-Powered Color Analysis application on Google Cloud Platform.

## Architecture

- **VM Instance**: Google Compute Engine (e2-standard-4, CPU-only)
- **Backend**: FastAPI with PyTorch ResNext50 model (port 8080)
- **Frontend**: React + Vite served by Nginx (port 80)
- **Model**: ResNext50 trained for seasonal color analysis

## Prerequisites

1. Google Cloud CLI installed and configured
2. GCP project with billing enabled
3. GitHub Personal Access Token (for private repo)

```bash
gcloud auth login
gcloud config set project dl-color-analysis-app
```

## Deployment Steps

### 1. Deploy Backend on VM

This script creates the VM, installs dependencies, clones the repo, and starts the backend:

```bash
./deploy-vm-cpu.sh
```

**What it does:**
- Creates VM with e2-standard-4 machine type
- Installs Python 3.10, system dependencies
- Clones the repository (requires GitHub PAT)
- Installs Python packages in virtual environment
- Downloads and sets up the ResNext50 model
- Starts backend service on port 8080

**Required input:** GitHub Personal Access Token

### 2. Deploy Frontend on VM

After backend is running, deploy the frontend:

```bash
./deploy-frontend-vm.sh
```

**What it does:**
- Installs Nginx and Node.js 20
- Builds React frontend with correct API URL
- Configures Nginx to serve frontend on port 80
- Sets up reverse proxy for `/api` and `/health` endpoints

## Access URLs

- **Frontend**: http://35.226.154.58
- **Backend API**: http://35.226.154.58:8080
- **Health Check**: http://35.226.154.58:8080/health

## VM Management

Use the `vm-manage.sh` script for common operations:

```bash
# Start VM
./vm-manage.sh start

# Stop VM (saves costs when not in use)
./vm-manage.sh stop

# SSH into VM
./vm-manage.sh ssh

# View backend logs
./vm-manage.sh logs

# Check VM status
./vm-manage.sh status

# Get VM IP
./vm-manage.sh ip
```

## Configuration Files

### Backend
- `back-end/color_analysis_api.py` - FastAPI application
- `back-end/requirements.txt` - Python dependencies
- `models/ResNext50/best_model_resnext50_rgbm.pth` - Trained model

### Frontend
- `front-end/Color-Analysis/.env.production` - API URL configuration
- `front-end/Color-Analysis/Dockerfile` - Container build (not used in VM deployment)

## Firewall Rules

Required firewall rules (automatically created):
- Port 80: Frontend access
- Port 8080: Backend API access

## Cost Estimation

**e2-standard-4 VM (4 vCPU, 16GB RAM):**
- Running 24/7: ~$120/month
- Running 8 hours/day: ~$40/month

**Tip:** Stop the VM when not in use with `./vm-manage.sh stop`

## Troubleshooting

### Backend not responding
```bash
# SSH into VM
./vm-manage.sh ssh

# Check backend logs
./vm-manage.sh logs

# Restart backend
cd ~/color-analysis
source venv/bin/activate
cd AI-Powered-Color-Analysis/back-end
python color_analysis_api.py
```

### Frontend not loading
```bash
# SSH into VM
./vm-manage.sh ssh

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Update frontend code
```bash
# SSH into VM
./vm-manage.sh ssh

# Navigate to repo
cd ~/color-analysis/AI-Powered-Color-Analysis

# Pull latest changes
git pull origin depolyment

# Rebuild frontend
cd front-end/Color-Analysis
VITE_API_BASE_URL=http://35.226.154.58:8080 npm run build

# Deploy to Nginx
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
```

## Security Notes

1. The application uses HTTP (not HTTPS) - suitable for testing
2. For production, consider adding SSL/TLS certificates
3. VM has public IP - restrict firewall rules if needed
4. GitHub token is stored in VM metadata during deployment

## Model Information

- **Architecture**: ResNext50
- **Input**: RGB + Masked face images
- **Output**: 4-class seasonal color palette (Spring/Summer/Autumn/Winter)
- **Size**: ~90MB
- **Device**: CPU (for free tier compatibility)
