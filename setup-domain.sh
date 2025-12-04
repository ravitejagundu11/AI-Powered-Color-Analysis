#!/bin/bash
set -e

# Configuration
VM_NAME="color-analysis-vm-cpu"
ZONE="us-central1-a"
PROJECT_ID="dl-color-analysis-app"
DOMAIN="color-analysis.me"
EMAIL="raviteja.gundu11@gmail.com"  # Update this with your actual email for Let's Encrypt

echo "🌐 Setting up domain: ${DOMAIN}"
echo "=================================================="

# Get VM IP
VM_IP=$(gcloud compute instances describe ${VM_NAME} \
    --zone=${ZONE} \
    --project=${PROJECT_ID} \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "📍 VM IP: ${VM_IP}"
echo ""
echo "⚠️  IMPORTANT: Before continuing, configure DNS in Namecheap:"
echo "   1. Go to Namecheap Dashboard → Domain List → Manage"
echo "   2. Go to Advanced DNS tab"
echo "   3. Add these records:"
echo ""
echo "   Type: A Record"
echo "   Host: @"
echo "   Value: ${VM_IP}"
echo "   TTL: Automatic"
echo ""
echo "   Type: A Record"
echo "   Host: www"
echo "   Value: ${VM_IP}"
echo "   TTL: Automatic"
echo ""
echo "   Type: A Record (optional - for API subdomain)"
echo "   Host: api"
echo "   Value: ${VM_IP}"
echo "   TTL: Automatic"
echo ""
read -p "Press Enter once DNS is configured (wait 5-10 minutes for propagation)..."

# Test DNS propagation
echo ""
echo "🔍 Testing DNS propagation..."
nslookup ${DOMAIN} || true
echo ""

read -p "Does the IP match ${VM_IP}? Press Enter to continue or Ctrl+C to abort..."

# Create setup script for VM
cat > /tmp/setup-domain.sh << VMSCRIPT
#!/bin/bash
set -e

DOMAIN="${DOMAIN}"
EMAIL="${EMAIL}"

echo "📦 Installing Certbot..."
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

echo "🔐 Obtaining SSL certificate..."
sudo certbot --nginx -d \${DOMAIN} -d www.\${DOMAIN} --non-interactive --agree-tos --email \${EMAIL} --redirect

echo "⚙️  Configuring Nginx for domain..."
sudo tee /etc/nginx/sites-available/color-analysis << 'NGINX_CONFIG'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS - Frontend
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/html;
    index index.html;

    # Frontend - serve React app
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API - proxy to FastAPI on port 8080
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8080/health;
    }

    # Direct backend access (optional, for testing)
    location /analyze-color {
        proxy_pass http://localhost:8080/analyze-color;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_CONFIG

# Test nginx configuration
sudo nginx -t

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

# Set up auto-renewal for SSL certificates
echo "⏰ Setting up SSL auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "🏗️  Rebuilding frontend with domain..."
cd ~/color-analysis/AI-Powered-Color-Analysis/front-end/Color-Analysis
VITE_API_BASE_URL=https://${DOMAIN} npm run build

echo "📋 Deploying updated frontend..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

echo ""
echo "✅ Domain setup complete!"
echo "🌐 Frontend: https://${DOMAIN}"
echo "🔧 Backend: https://${DOMAIN}/api"
echo "❤️  Health: https://${DOMAIN}/health"
VMSCRIPT

# Upload and execute script on VM
echo "📤 Uploading setup script to VM..."
gcloud compute scp /tmp/setup-domain.sh ${VM_NAME}:~/ \
    --zone=${ZONE} \
    --project=${PROJECT_ID}

echo "🚀 Running domain setup on VM..."
gcloud compute ssh ${VM_NAME} \
    --zone=${ZONE} \
    --project=${PROJECT_ID} \
    --command="chmod +x ~/setup-domain.sh && ~/setup-domain.sh"

# Clean up
rm /tmp/setup-domain.sh

echo ""
echo "=================================================="
echo "✅ Domain setup complete!"
echo ""
echo "🌐 Your app is now available at:"
echo "   Frontend: https://${DOMAIN}"
echo "   Backend:  https://${DOMAIN}/api"
echo "   Health:   https://${DOMAIN}/health"
echo ""
echo "📝 SSL certificate will auto-renew every 90 days"
echo "=================================================="
