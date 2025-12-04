#!/bin/bash
set -e

# Configuration
VM_NAME="color-analysis-vm-cpu"
ZONE="us-central1-a"
PROJECT_ID="dl-color-analysis-app"
GITHUB_REPO="https://github.com/ravitejagundu11/AI-Powered-Color-Analysis.git"
BRANCH="main"

echo "🚀 Deploying frontend to VM..."

# Create a temporary script to run on the VM
cat > /tmp/setup-frontend.sh << 'VMSCRIPT'
#!/bin/bash
set -e

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Install Node.js 20 if not already installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if repository exists (should be there from backend deployment)
REPO_DIR="/home/$(whoami)/color-analysis/AI-Powered-Color-Analysis"
if [ ! -d "$REPO_DIR" ]; then
    echo "❌ Repository not found at $REPO_DIR"
    exit 1
fi

# Navigate to frontend directory
cd "$REPO_DIR/front-end/Color-Analysis"
echo "🏗️  Building frontend..."
VITE_API_BASE_URL=http://35.226.154.58:8080 npm install
VITE_API_BASE_URL=http://35.226.154.58:8080 npm run build

# Copy built files to nginx directory
echo "📋 Copying files to nginx..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# Create nginx configuration
echo "⚙️  Configuring nginx..."
sudo tee /etc/nginx/sites-available/color-analysis << 'NGINX_CONFIG'
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    # Frontend - serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - proxy to FastAPI on port 8080
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8080/health;
    }
}
NGINX_CONFIG

# Enable the site
sudo ln -sf /etc/nginx/sites-available/color-analysis /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Frontend deployed successfully!"
echo "🌐 Access the app at: http://$(curl -s ifconfig.me)"
VMSCRIPT

# Copy script to VM and execute
echo "📤 Uploading setup script to VM..."
gcloud compute scp /tmp/setup-frontend.sh ${VM_NAME}:~/ \
    --zone=${ZONE} \
    --project=${PROJECT_ID}

echo "🔧 Running setup on VM..."
gcloud compute ssh ${VM_NAME} \
    --zone=${ZONE} \
    --project=${PROJECT_ID} \
    --command="chmod +x ~/setup-frontend.sh && ~/setup-frontend.sh"

# Clean up
rm /tmp/setup-frontend.sh

# Get the external IP
EXTERNAL_IP=$(gcloud compute instances describe ${VM_NAME} \
    --zone=${ZONE} \
    --project=${PROJECT_ID} \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend URL: http://${EXTERNAL_IP}"
echo "🔧 Backend API: http://${EXTERNAL_IP}/api"
echo "❤️  Health check: http://${EXTERNAL_IP}/health"
