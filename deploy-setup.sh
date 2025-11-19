#!/bin/bash

# Quick Setup Script for Hostinger VPS Deployment
# Run this script on your VPS after connecting via SSH

set -e

echo "=========================================="
echo "ChessRep VPS Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Update system
print_info "Updating system packages..."
apt-get update -y
apt-get upgrade -y
print_success "System updated"

# Install Node.js
print_info "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Install Python
print_info "Installing Python..."
apt-get install -y python3 python3-pip python3-venv
print_success "Python installed: $(python3 --version)"

# Install MongoDB
print_info "Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    print_success "MongoDB installed and started"
else
    print_success "MongoDB already installed"
fi

# Install Nginx
print_info "Installing Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
print_success "Nginx installed and started"

# Install Redis
print_info "Installing Redis..."
apt-get install -y redis-server
systemctl start redis-server
systemctl enable redis-server
print_success "Redis installed and started"

# Install Stockfish
print_info "Installing Stockfish..."
apt-get install -y stockfish
print_success "Stockfish installed"

# Install PM2
print_info "Installing PM2..."
npm install -g pm2
print_success "PM2 installed"

# Install Certbot
print_info "Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Configure Firewall
print_info "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
print_success "Firewall configured"

# Create application directory
print_info "Creating application directory..."
mkdir -p /var/www/chessrep
print_success "Directory created: /var/www/chessrep"

echo ""
echo "=========================================="
print_success "Setup completed successfully!"
echo "=========================================="
echo ""
print_info "Next steps:"
echo "1. Upload your code to /var/www/chessrep"
echo "2. Configure environment variables"
echo "3. Install dependencies and build frontend"
echo "4. Configure Nginx"
echo "5. Set up DNS in GoDaddy"
echo "6. Obtain SSL certificate"
echo ""
print_info "See HOSTINGER_DEPLOYMENT_GUIDE.md for detailed instructions"

