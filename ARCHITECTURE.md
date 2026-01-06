# AI-Powered Color Analysis - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   USERS                                      │
│                          (Web Browsers / Mobile)                             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DNS & SSL/TLS LAYER                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Domain: color-analysis.me                                            │  │
│  │  SSL Certificate: Let's Encrypt                                       │  │
│  │  Static IP: 35.222.13.151                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE CLOUD PLATFORM (GCP)                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     Compute Engine VM                               │    │
│  │  Name: color-analysis-vm-cpu                                        │    │
│  │  Type: e2-standard-4 (4 vCPUs, 16GB RAM)                           │    │
│  │  Zone: us-central1-a                                                │    │
│  │  OS: Debian 11                                                      │    │
│  │                                                                      │    │
│  │  ┌────────────────────────────────────────────────────────────┐    │    │
│  │  │              NGINX Web Server                               │    │    │
│  │  │  - Port: 80 → 443 (HTTPS redirect)                         │    │    │
│  │  │  - Serves React frontend (static files)                    │    │    │
│  │  │  - Reverse proxy to backend                                │    │    │
│  │  │  - Client max body size: 20MB                              │    │    │
│  │  │  - CORS handling                                            │    │    │
│  │  │                                                              │    │    │
│  │  │  Proxied Endpoints:                                         │    │    │
│  │  │    /analyze-color                                           │    │    │
│  │  │    /get-matching-clothes                                    │    │    │
│  │  │    /get-image-by-docid                                      │    │    │
│  │  │    /health, /docs, /redoc                                   │    │    │
│  │  └────────────────┬───────────────────────────────────────────┘    │    │
│  │                   │                                                 │    │
│  │                   │ localhost:8080                                  │    │
│  │                   ▼                                                 │    │
│  │  ┌────────────────────────────────────────────────────────────┐    │    │
│  │  │         FastAPI Backend (Systemd Service)                   │    │    │
│  │  │  - Python 3.9                                               │    │    │
│  │  │  - Service: color-analysis.service                          │    │    │
│  │  │  - Port: 8080 (internal only)                               │    │    │
│  │  │  - Max upload: 10MB                                         │    │    │
│  │  │                                                              │    │    │
│  │  │  Components:                                                │    │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │    │    │
│  │  │  │  PyTorch Model (ResNext50)                           │  │    │    │
│  │  │  │  - Color season classification                        │  │    │    │
│  │  │  │  - 4 seasons: Spring/Summer/Autumn/Winter            │  │    │    │
│  │  │  │  - Device: CPU                                        │  │    │    │
│  │  │  └──────────────────────────────────────────────────────┘  │    │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │    │    │
│  │  │  │  Color Recommendation Engine V2                      │  │    │    │
│  │  │  │  - Primary/Secondary palette generation              │  │    │    │
│  │  │  │  - 12 colors per palette                             │  │    │    │
│  │  │  │  - Seasonal color mapping                            │  │    │    │
│  │  │  └──────────────────────────────────────────────────────┘  │    │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │    │    │
│  │  │  │  Image Processing Pipeline                            │  │    │    │
│  │  │  │  - Rembg (background removal)                        │  │    │    │
│  │  │  │  - ColorThief (dominant color extraction)            │  │    │    │
│  │  │  │  - Face masking preprocessor (optional)              │  │    │    │
│  │  │  │  - ONNX Runtime                                       │  │    │    │
│  │  │  └──────────────────────────────────────────────────────┘  │    │    │
│  │  │                                                              │    │    │
│  │  │  Environment Variables (.env):                              │    │    │
│  │  │    - API_BASE_URL: https://color-analysis.me               │    │    │
│  │  │    - MONGO_URI: mongodb+srv://...                           │    │    │
│  │  └────────────────┬───────────────────────────────────────────┘    │    │
│  │                   │                                                 │    │
│  │                   │                                                 │    │
│  │  ┌────────────────▼───────────────────────────────────────────┐    │    │
│  │  │         Google Cloud Ops Agent                              │    │    │
│  │  │  - Logs forwarding to Cloud Logging                         │    │    │
│  │  │  - System metrics collection                                │    │    │
│  │  │  - Journald log capture                                     │    │    │
│  │  └────────────────────────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Internet
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐    ┌───────────────────────┐    ┌──────────────────┐
│   MongoDB     │    │   Frontend Hosting    │    │  Model Storage   │
│    Atlas      │    │   (Static Files)      │    │   (GitHub)       │
├───────────────┤    ├───────────────────────┤    ├──────────────────┤
│ Database:     │    │ Location:             │    │ Repository:      │
│ color_analysis│    │ /var/www/html/        │    │ models/          │
│               │    │                       │    │                  │
│ Collections:  │    │ React + Vite Build:   │    │ ResNext50/       │
│ ├─ photos     │    │ ├─ index.html         │    │ ├─ .pth model   │
│ │  (clothes)  │    │ ├─ assets/            │    │ └─ training code│
│ │  - _id      │    │ ├─ JavaScript chunks  │    │                  │
│ │  - top2_colors    │ └─ CSS files          │    │ DenseNet/        │
│ │  - image_base64   │                       │    │ EfficientNetB0/  │
│ │  - gender   │    │ Components:           │    │ ResNet34/        │
│ │              │    │ ├─ CameraView         │    │                  │
│ └─ color_     │    │ ├─ ResultView         │    │                  │
│    similarity │    │ ├─ PaletteGrid        │    │                  │
│    - primary_color  │ ├─ LazyImage          │    │                  │
│    - similar_colors │ ├─ ImageModal         │    │                  │
│                │    │ └─ ProcessingView     │    │                  │
│ Region:       │    │                       │    │                  │
│ US_EAST_1     │    │ Environment:          │    │                  │
│               │    │ VITE_API_BASE_URL     │    │                  │
│ Connection:   │    │ = color-analysis.me   │    │                  │
│ mongodb+srv:// │    │                       │    │                  │
│ 27017         │    │                       │    │                  │
└───────────────┘    └───────────────────────┘    └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW DIAGRAM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER UPLOADS IMAGE                                                       │
│     User → Frontend → NGINX → FastAPI Backend                               │
│     ├─ Image validation (format, size < 10MB)                               │
│     └─ Base64 encoding                                                       │
│                                                                              │
│  2. IMAGE PROCESSING                                                         │
│     Backend processes image:                                                 │
│     ├─ Background removal (Rembg)                                            │
│     ├─ Face masking (optional)                                               │
│     ├─ Resize & normalize (224x224)                                          │
│     └─ Convert to tensor                                                     │
│                                                                              │
│  3. COLOR ANALYSIS                                                           │
│     PyTorch Model inference:                                                 │
│     ├─ ResNext50 classification                                              │
│     ├─ Season prediction (Spring/Summer/Autumn/Winter)                       │
│     └─ Confidence scores                                                     │
│                                                                              │
│  4. COLOR RECOMMENDATION                                                     │
│     Color Engine generates:                                                  │
│     ├─ Primary palette (12 colors)                                           │
│     └─ Secondary palette (12 colors)                                         │
│                                                                              │
│  5. CLOTHING RECOMMENDATIONS                                                 │
│     Frontend → Backend → MongoDB:                                            │
│     ├─ Query color_similarity collection                                     │
│     ├─ Find similar colors                                                   │
│     ├─ Query photos collection (with gender filter)                          │
│     ├─ Match clothes by top2_colors                                          │
│     └─ Return image URLs (via GridFS/Base64)                                 │
│                                                                              │
│  6. RESPONSE TO USER                                                         │
│     Backend → NGINX → Frontend → User:                                       │
│     ├─ Season classification                                                 │
│     ├─ Color palettes (with hex codes)                                       │
│     ├─ Matching clothing images                                              │
│     └─ Confidence scores                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEPLOYMENT WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Local Development → GitHub → GCP VM                                         │
│                                                                              │
│  1. Developer commits to 'main' branch                                       │
│     └─ GitHub repository updated                                             │
│                                                                              │
│  2. Run deployment script: ./update-deployment.sh                            │
│     ├─ SSH into GCP VM                                                       │
│     ├─ Pull latest code from 'main' branch                                   │
│     ├─ Install Python dependencies                                           │
│     ├─ Restart backend service (systemd)                                     │
│     ├─ Build frontend (npm run build)                                        │
│     ├─ Deploy to Nginx (/var/www/html/)                                      │
│     └─ Reload Nginx                                                          │
│                                                                              │
│  3. Backend starts:                                                          │
│     ├─ Load environment variables (.env)                                     │
│     ├─ Connect to MongoDB Atlas                                              │
│     ├─ Load PyTorch model                                                    │
│     ├─ Initialize Color Engine                                               │
│     └─ Start Uvicorn on port 8080                                            │
│                                                                              │
│  4. Health checks:                                                           │
│     └─ curl https://color-analysis.me/health                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY TECHNOLOGIES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Backend:                                                                    │
│  ├─ FastAPI (Python web framework)                                           │
│  ├─ PyTorch 2.0.1 (ML framework)                                             │
│  ├─ Uvicorn (ASGI server)                                                    │
│  ├─ PyMongo 4.10.1 (MongoDB driver)                                          │
│  ├─ Rembg 2.0.59 (background removal)                                        │
│  ├─ ColorThief 0.2.1 (color extraction)                                      │
│  ├─ ONNX Runtime 1.16.3 (inference optimization)                             │
│  └─ Python-dotenv (environment management)                                   │
│                                                                              │
│  Frontend:                                                                   │
│  ├─ React 18 + TypeScript                                                    │
│  ├─ Vite 7.1.7 (build tool)                                                  │
│  ├─ React Webcam (camera integration)                                        │
│  └─ Custom hooks (useImageAnalysis)                                          │
│                                                                              │
│  Infrastructure:                                                             │
│  ├─ Nginx 1.18.0 (web server + reverse proxy)                                │
│  ├─ Systemd (service management)                                             │
│  ├─ Let's Encrypt (SSL certificates)                                         │
│  ├─ Google Cloud Ops Agent (monitoring)                                      │
│  └─ Cloud Logging (log aggregation)                                          │
│                                                                              │
│  Database:                                                                   │
│  ├─ MongoDB Atlas (cloud database)                                           │
│  ├─ GridFS/Base64 (image storage)                                            │
│  └─ Color similarity indexing                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY & PERFORMANCE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Security:                                                                   │
│  ├─ HTTPS only (Let's Encrypt TLS 1.2+)                                      │
│  ├─ Environment variable isolation (.env files)                              │
│  ├─ MongoDB connection string encryption                                     │
│  ├─ CORS configuration                                                       │
│  ├─ File upload validation & size limits                                     │
│  └─ Backend not publicly accessible (proxied via Nginx)                      │
│                                                                              │
│  Performance:                                                                │
│  ├─ Image lazy loading                                                       │
│  ├─ Frontend code splitting                                                  │
│  ├─ Nginx static file caching                                                │
│  ├─ MongoDB connection pooling                                               │
│  ├─ Efficient tensor operations (PyTorch)                                    │
│  └─ Background removal optimization                                          │
│                                                                              │
│  Monitoring:                                                                 │
│  ├─ Cloud Logging (application logs)                                         │
│  ├─ Health check endpoint                                                    │
│  ├─ Systemd service status                                                   │
│  ├─ MongoDB query performance logs                                           │
│  └─ Error tracking with detailed logging                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         COST STRUCTURE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GCP Compute Engine:                                                         │
│  ├─ e2-standard-4 VM: ~$125/month (24/7 running)                             │
│  ├─ Static IP: ~$3/month                                                     │
│  └─ Network egress: Variable                                                 │
│                                                                              │
│  MongoDB Atlas:                                                              │
│  └─ Free tier (M0) - 512MB storage                                           │
│                                                                              │
│  Domain & SSL:                                                               │
│  ├─ Domain registration: Variable                                            │
│  └─ Let's Encrypt SSL: Free                                                  │
│                                                                              │
│  Total Monthly Cost: ~$130/month (approximate)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Reference

### URLs
- **Production**: https://color-analysis.me
- **Backend API**: https://color-analysis.me/docs
- **Health Check**: https://color-analysis.me/health

### SSH Access
```bash
gcloud compute ssh color-analysis-vm-cpu \
  --zone=us-central1-a \
  --project=dl-color-analysis-app
```

### Deployment
```bash
./update-deployment.sh
```

### Log Access
```bash
# Backend logs
sudo journalctl -u color-analysis -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Service Management
```bash
# Backend
sudo systemctl status color-analysis
sudo systemctl restart color-analysis

# Nginx
sudo systemctl status nginx
sudo systemctl reload nginx
```
