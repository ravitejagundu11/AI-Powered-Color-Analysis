#!/bin/bash

# Quick Deployment Script for AI-Powered Color Analysis
# This script automates the deployment process to Google Cloud

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"dl-color-analysis-app"}
REGION=${REGION:-"us-central1"}
REPO_NAME="color-analysis-repo"

echo -e "${GREEN}🚀 AI-Powered Color Analysis - Google Cloud Deployment${NC}"
echo "=================================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker Desktop.${NC}"
    echo "Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting project: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Set region
echo -e "${YELLOW}📍 Setting region: $REGION${NC}"
gcloud config set run/region $REGION

# Deploy Backend
echo ""
echo -e "${GREEN}📦 Step 1: Deploying Backend...${NC}"
echo "=================================================="

echo "Building backend image with models..."
BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend"
gcloud builds submit --config=back-end/cloudbuild.yaml --substitutions=_REGION=$REGION,_REPO_NAME=$REPO_NAME .

echo "Deploying backend to Cloud Run..."
gcloud run deploy color-analysis-backend \
    --image $BACKEND_IMAGE \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 16Gi \
    --cpu 4 \
    --timeout 600 \
    --max-instances 2 \
    --concurrency 1 \
    --execution-environment gen2 \
    --cpu-boost \
    --gpu 1 \
    --gpu-type nvidia-l4 \
    --no-gpu-zonal-redundancy \
    --quiet

# Get backend URL
BACKEND_URL=$(gcloud run services describe color-analysis-backend \
    --region $REGION \
    --format 'value(status.url)')

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo -e "Backend URL: ${GREEN}$BACKEND_URL${NC}"

# Deploy Frontend
echo ""
echo -e "${GREEN}📦 Step 2: Deploying Frontend...${NC}"
echo "=================================================="

# Create production environment file
echo "VITE_API_BASE_URL=$BACKEND_URL" > front-end/Color-Analysis/.env.production
echo "Created .env.production with backend URL"

echo "Building frontend image..."
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/frontend"
gcloud builds submit --config=front-end/Color-Analysis/cloudbuild.yaml --substitutions=_REGION=$REGION,_REPO_NAME=$REPO_NAME .

echo "Deploying frontend to Cloud Run..."
gcloud run deploy color-analysis-frontend \
    --image $FRONTEND_IMAGE \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --timeout 30 \
    --max-instances 10 \
    --min-instances 0 \
    --quiet

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe color-analysis-frontend \
    --region $REGION \
    --format 'value(status.url)')

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo -e "Frontend URL: ${GREEN}$FRONTEND_URL${NC}"

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo -e "📊 ${YELLOW}Your Application URLs:${NC}"
echo -e "   Frontend:  ${GREEN}$FRONTEND_URL${NC}"
echo -e "   Backend:   ${GREEN}$BACKEND_URL${NC}"
echo -e "   API Docs:  ${GREEN}$BACKEND_URL/docs${NC}"
echo ""
echo -e "🔍 ${YELLOW}Next Steps:${NC}"
echo "   1. Test your application: open $FRONTEND_URL"
echo "   2. Check backend health: curl $BACKEND_URL/health"
echo "   3. View API documentation: open $BACKEND_URL/docs"
echo "   4. Monitor logs: gcloud run services logs tail color-analysis-backend"
echo ""
echo -e "💰 ${YELLOW}Monitor Costs:${NC}"
echo "   https://console.cloud.google.com/billing?project=$PROJECT_ID"
echo ""
echo -e "📚 ${YELLOW}Documentation:${NC}"
echo "   See GOOGLE_CLOUD_DEPLOYMENT.md for detailed instructions"
echo ""
