#!/bin/bash

# VM Deployment Script for AI-Powered Color Analysis (CPU-only version)
# This script creates a CPU-only VM for testing without GPU

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"dl-color-analysis-app"}
ZONE=${ZONE:-"us-central1-a"}
VM_NAME="color-analysis-vm-cpu"
MACHINE_TYPE="e2-standard-4"
BOOT_DISK_SIZE="50GB"

echo -e "${GREEN}🚀 AI-Powered Color Analysis - CPU VM Deployment${NC}"
echo "=================================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting project: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Create VM without GPU (for free tier)
echo ""
echo -e "${GREEN}📦 Step 1: Creating CPU-only VM...${NC}"
echo "=================================================="

gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --boot-disk-size=$BOOT_DISK_SIZE \
    --boot-disk-type=pd-standard \
    --tags=http-server,https-server \
    --scopes=cloud-platform

echo -e "${GREEN}✅ VM created successfully!${NC}"

# Wait for VM to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for VM to be ready and SSH to become available...${NC}"

# Wait for SSH to be ready
for i in {1..20}; do
    if gcloud compute ssh $VM_NAME --zone=$ZONE --command="echo 'SSH ready'" 2>/dev/null; then
        echo -e "${GREEN}✅ VM is ready!${NC}"
        break
    fi
    echo "Waiting for SSH... ($i/20)"
    sleep 10
done

# Create firewall rule for backend
echo ""
echo -e "${GREEN}📦 Step 2: Setting up firewall...${NC}"
echo "=================================================="

gcloud compute firewall-rules create allow-color-analysis-backend \
    --allow=tcp:8080 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server \
    --description="Allow access to color analysis backend on port 8080" || echo "Firewall rule already exists"

echo -e "${GREEN}✅ Firewall configured!${NC}"

# Get VM external IP
VM_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo -e "${GREEN}📦 Step 3: Deploying application...${NC}"
echo "=================================================="

echo ""
echo -e "${YELLOW}You'll need a GitHub Personal Access Token.${NC}"
echo -e "Create one at: ${GREEN}https://github.com/settings/tokens${NC}"
echo -e "Required scopes: ${GREEN}repo${NC} (Full control of private repositories)"
echo ""
read -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: Token cannot be empty${NC}"
    exit 1
fi

# Create deployment script with GitHub token
cat > /tmp/deploy_on_vm.sh << EOF
#!/bin/bash
set -e

GITHUB_TOKEN="$GITHUB_TOKEN"

echo "=== Installing system dependencies ==="
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv git curl wget

echo "=== Creating application directory ==="
mkdir -p ~/color-analysis
cd ~/color-analysis

echo "=== Setting up Python virtual environment ==="
python3 -m venv venv
source venv/bin/activate

echo "=== Cloning private repository ==="
if [ ! -d "AI-Powered-Color-Analysis" ]; then
    git clone https://\${GITHUB_TOKEN}@github.com/ravitejagundu11/AI-Powered-Color-Analysis.git
else
    cd AI-Powered-Color-Analysis
    git pull origin depolyment || git pull origin main || git pull origin master || true
    cd ..
fi

cd AI-Powered-Color-Analysis/back-end

echo "=== Installing Python dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Checking PyTorch (CPU mode) ==="
python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'Device: CPU')" || echo "PyTorch check failed"

echo "=== Creating systemd service ==="
sudo tee /etc/systemd/system/color-analysis.service > /dev/null << SERVICE
[Unit]
Description=Color Analysis Backend API
After=network.target

[Service]
Type=simple
User=\$USER
WorkingDirectory=\$HOME/color-analysis/AI-Powered-Color-Analysis/back-end
Environment="PATH=\$HOME/color-analysis/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONUNBUFFERED=1"
ExecStart=\$HOME/color-analysis/venv/bin/uvicorn color_analysis_api:app --host 0.0.0.0 --port 8080 --workers 1
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

echo "=== Enabling and starting service ==="
sudo systemctl daemon-reload
sudo systemctl enable color-analysis
sudo systemctl start color-analysis

echo "=== Waiting for service to start ==="
sleep 5

echo "=== Checking service status ==="
sudo systemctl status color-analysis --no-pager || true

echo "=== Checking if service is responding ==="
sleep 3
curl -f http://localhost:8080/health || echo "Health check failed - service may still be starting"

echo ""
echo "=== Deployment complete! ==="
echo "Check logs with: sudo journalctl -u color-analysis -f"
EOF

# Upload and execute deployment script
echo "Uploading deployment script to VM..."
gcloud compute scp /tmp/deploy_on_vm.sh $VM_NAME:~/deploy_on_vm.sh --zone=$ZONE

echo ""
echo -e "${YELLOW}Executing deployment on VM (this will take 3-5 minutes)...${NC}"
echo "Installing dependencies and starting service..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="bash ~/deploy_on_vm.sh" || {
    echo -e "${YELLOW}⚠️  Deployment script had issues. Checking status...${NC}"
    gcloud compute ssh $VM_NAME --zone=$ZONE --command="sudo systemctl status color-analysis --no-pager" || true
}

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo -e "📊 ${YELLOW}Your VM Details:${NC}"
echo -e "   VM Name:   ${GREEN}$VM_NAME${NC}"
echo -e "   Zone:      ${GREEN}$ZONE${NC}"
echo -e "   IP:        ${GREEN}$VM_IP${NC}"
echo -e "   Backend:   ${GREEN}http://$VM_IP:8080${NC}"
echo -e "   API Docs:  ${GREEN}http://$VM_IP:8080/docs${NC}"
echo ""
echo -e "🔍 ${YELLOW}Useful Commands:${NC}"
echo "   SSH to VM:         gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "   Check logs:        gcloud compute ssh $VM_NAME --zone=$ZONE --command='sudo journalctl -u color-analysis -f'"
echo "   Stop service:      gcloud compute ssh $VM_NAME --zone=$ZONE --command='sudo systemctl stop color-analysis'"
echo "   Start service:     gcloud compute ssh $VM_NAME --zone=$ZONE --command='sudo systemctl start color-analysis'"
echo "   Stop VM:           gcloud compute instances stop $VM_NAME --zone=$ZONE"
echo "   Start VM:          gcloud compute instances start $VM_NAME --zone=$ZONE"
echo "   Delete VM:         gcloud compute instances delete $VM_NAME --zone=$ZONE"
echo ""
echo -e "🧪 ${YELLOW}Test the API:${NC}"
echo "   curl http://$VM_IP:8080/health"
echo ""
echo -e "💰 ${YELLOW}Cost Info:${NC}"
echo "   CPU VM: ~\$30-40/month (e2-standard-4)"
echo "   Remember to stop when not in use!"
echo ""
echo -e "⚠️  ${YELLOW}Note:${NC}"
echo "   This is CPU-only mode. Inference will be slower than GPU."
echo "   To use GPU, upgrade your billing account to paid tier."
echo ""
