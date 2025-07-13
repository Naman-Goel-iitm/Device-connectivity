#!/bin/bash

# DigitalOcean VPS Deployment Script
# This script helps deploy your Node.js server to DigitalOcean

echo "🚀 Starting DigitalOcean VPS deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create app directory
echo "📁 Setting up application directory..."
sudo mkdir -p /var/www/device-connect
sudo chown $USER:$USER /var/www/device-connect

# Copy server files
echo "📋 Copying server files..."
cp -r server/* /var/www/device-connect/

# Install dependencies
echo "📦 Installing dependencies..."
cd /var/www/device-connect
npm install

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'device-connect-server',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 3000
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "✅ Deployment complete!"
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs device-connect-server"
echo "🌐 Your server should be running on: http://YOUR_SERVER_IP:3000" 