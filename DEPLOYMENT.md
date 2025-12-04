# AI-Powered Color Analysis - Deployment Guide

This guide covers the complete deployment of the AI-Powered Color Analysis application on Google Cloud Platform.

## Architecture

- **VM Instance**: Google Compute Engine (e2-standard-4, CPU-only)
- **Static IP**: 35.222.13.151 (reserved, won't change on restart)
- **Domain**: color-analysis.me with SSL/TLS (Let's Encrypt)
- **Backend**: FastAPI with PyTorch ResNext50 model (localhost:8080, not publicly accessible)
- **Frontend**: React + Vite served by Nginx (ports 80/443)
- **Web Server**: Nginx with reverse proxy and SSL termination
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
- Builds React frontend with domain URL (https://color-analysis.me)
- Configures Nginx to serve frontend on port 80
- Sets up reverse proxy for API endpoints

### 3. Configure Domain and SSL

After frontend is deployed, set up custom domain with SSL:

```bash
./setup-domain.sh
```

**What it does:**
- Verifies DNS configuration
- Installs Certbot for Let's Encrypt
- Obtains SSL/TLS certificates
- Configures Nginx for HTTPS with reverse proxy
- Rebuilds frontend with HTTPS domain URL
- Sets up automatic certificate renewal

**Prerequisites:** DNS A record must point color-analysis.me to VM IP

## Access URLs

- **Production (HTTPS)**:
  - Frontend: https://color-analysis.me
  - API Documentation: https://color-analysis.me/docs
  - Health Check: https://color-analysis.me/health
  - Backend API: https://color-analysis.me/analyze-color

- **VM Direct Access**:
  - HTTP: http://35.222.13.151 (redirects to HTTPS)
  - Backend: localhost:8080 only (not publicly accessible for security)

**Note:** Backend port 8080 is blocked externally and only accessible through Nginx reverse proxy.

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

## Update Deployed Application

To deploy code changes:

```bash
# 1. Commit and push changes to GitHub
git add .
git commit -m "Your changes"
git push origin main

# 2. Run update script (pulls code, rebuilds, restarts services)
./update-deployment.sh
```

**What update-deployment.sh does:**
- Pulls latest code from GitHub
- Restarts backend service
- Rebuilds frontend with production API URL
- Reloads Nginx
- Verifies deployment

## Configuration Files

### Backend
- `back-end/color_analysis_api.py` - FastAPI application
- `back-end/requirements.txt` - Python dependencies
- `models/ResNext50/best_model_resnext50_rgbm.pth` - Trained model

### Frontend
- `front-end/Color-Analysis/.env.production` - API URL configuration
- `front-end/Color-Analysis/Dockerfile` - Container build (not used in VM deployment)

## Firewall Rules

Required firewall rules:
- **Port 80** (HTTP): Redirects to HTTPS
- **Port 443** (HTTPS): Secure frontend and API access
- **Port 8080** (Backend): BLOCKED externally, only accessible via localhost for security

Firewall configuration:
```bash
# View current rules
gcloud compute firewall-rules list --project=dl-color-analysis-app

# Rules created:
# - default-allow-http (port 80)
# - allow-https (port 443)
# - Backend port 8080 NOT exposed (security hardening)
```

## Cost Estimation

**Monthly Costs:**
- **e2-standard-4 VM** (4 vCPU, 16GB RAM):
  - Running 24/7: ~$120/month
  - Running 8 hours/day: ~$40/month
- **Static IP**: ~$3-4/month (reserved, prevents IP changes)
- **SSL Certificate**: Free (Let's Encrypt)
- **Total (24/7)**: ~$125/month

**Cost Optimization:**
- Stop VM when not in use: `./vm-manage.sh stop`
- Static IP ensures same IP when restarting (no DNS changes needed)
- VM restarts are fast (~1 minute)

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

### Update code manually
```bash
# Option 1: Use update script (recommended)
./update-deployment.sh

# Option 2: Manual update on VM
./vm-manage.sh ssh

cd ~/color-analysis/AI-Powered-Color-Analysis
git pull origin main

# Restart backend
sudo systemctl restart color-analysis

# Rebuild frontend
cd front-end/Color-Analysis
VITE_API_BASE_URL=https://color-analysis.me npm run build

# Deploy to Nginx
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx
```

## Security Notes

1. **HTTPS Enabled**: SSL/TLS certificates from Let's Encrypt with auto-renewal
2. **Backend Protected**: Port 8080 blocked externally, only accessible via Nginx reverse proxy
3. **Static IP**: Reserved IP prevents DNS issues on VM restart
4. **Certificate Renewal**: Automatic via Certbot systemd timer (every 90 days)
5. **GitHub Token**: Stored in VM metadata during deployment (remove if needed)
6. **Nginx Security**: Configured with proper headers and reverse proxy rules

### SSL Certificate Renewal

Certificates auto-renew via Certbot. To manually renew:

```bash
./vm-manage.sh ssh
sudo certbot renew
sudo systemctl reload nginx
```

### DNS Configuration

Domain: color-analysis.me
- **A Record**: @ → 35.222.13.151
- **TTL**: 300 seconds (for faster propagation)
- **Registrar**: Namecheap

## Model Information

- **Architecture**: ResNext50
- **Input**: RGB + Masked face images
- **Output**: 4-class seasonal color palette (Spring/Summer/Autumn/Winter)
- **Size**: ~90MB
- **Device**: CPU (for free tier compatibility)
