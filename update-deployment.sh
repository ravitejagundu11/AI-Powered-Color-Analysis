#!/bin/bash
set -e

# Configuration
VM_NAME="color-analysis-vm-cpu"
ZONE="us-central1-a"
PROJECT_ID="dl-color-analysis-app"

echo "🔄 Updating deployment with latest code..."

# Create update script for VM
cat > /tmp/update-deployment.sh << 'VMSCRIPT'
#!/bin/bash
set -e

echo "📥 Pulling latest code..."
cd ~/color-analysis/AI-Powered-Color-Analysis
git pull origin main

echo "🔄 Restarting backend..."
# Kill existing backend process
pkill -f "python.*color_analysis_api.py" || true
sleep 2

# Start backend in background
cd ~/color-analysis
source venv/bin/activate
cd AI-Powered-Color-Analysis/back-end
nohup python color_analysis_api.py > ~/backend.log 2>&1 &

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🏗️  Rebuilding frontend..."
cd ~/color-analysis/AI-Powered-Color-Analysis/front-end/Color-Analysis
VITE_API_BASE_URL=https://color-analysis.me npm run build

echo "📋 Deploying frontend to Nginx..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx

echo "✅ Deployment updated successfully!"

# Check backend health
echo ""
echo "🔍 Checking backend health..."
curl -s http://localhost:8080/health | python3 -m json.tool || echo "Backend starting up..."

echo ""
echo "🌐 Frontend: https://color-analysis.me"
echo "🔧 Backend: https://color-analysis.me (proxied)"
VMSCRIPT

# Upload and execute script on VM
echo "📤 Uploading update script to VM..."
gcloud compute scp /tmp/update-deployment.sh ${VM_NAME}:~/ \
    --zone=${ZONE} \
    --project=${PROJECT_ID}

echo "🚀 Running update on VM..."
gcloud compute ssh ${VM_NAME} \
    --zone=${ZONE} \
    --project=${PROJECT_ID} \
    --command="chmod +x ~/update-deployment.sh && ~/update-deployment.sh"

# Clean up
rm /tmp/update-deployment.sh

echo ""
echo "✅ Update complete!"
echo "🌐 Test your app at: https://color-analysis.me"
