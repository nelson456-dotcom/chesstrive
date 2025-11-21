#!/bin/bash

# Start backend server with PM2
# Run this on your VPS

echo "=== STARTING BACKEND SERVER ==="
echo ""

cd /var/www/chessrep/chessrep-main/backend

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Check if backend is already running
if pm2 list | grep -q "backend.*online"; then
    echo "✅ Backend is already running"
    pm2 list | grep backend
else
    echo "Starting backend server..."
    
    # Start with PM2
    pm2 start server.js --name backend --cwd /var/www/chessrep/chessrep-main/backend
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 to start on boot
    pm2 startup
    
    echo "✅ Backend started"
    pm2 list | grep backend
fi

echo ""
echo "=== BACKEND STATUS ==="
pm2 logs backend --lines 10 --nostream

