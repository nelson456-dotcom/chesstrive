#!/bin/bash

# Fix 500 Internal Server Error - Complete Reset Script
# Run this on your VPS: bash fix-500-error.sh

echo "🛑 Stopping all PM2 processes..."
pm2 stop all

echo "📥 Pulling latest code..."
cd /var/www/chessrep/chessrep-main
git fetch origin
git reset --hard origin/main

echo "📦 Reinstalling backend dependencies..."
cd backend
rm -rf node_modules
npm install

echo "🔄 Restarting MongoDB..."
sudo systemctl restart mongod

echo "🚀 Restarting backend..."
pm2 restart chessrep-backend

# If backend is not running, start it
if ! pm2 list | grep -q "chessrep-backend"; then
    echo "⚠️ Backend not in PM2, starting it..."
    pm2 start server.js --name chessrep-backend --cwd /var/www/chessrep/chessrep-main/backend
    pm2 save
fi

echo "🌐 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Checking status..."
echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== MongoDB Status ==="
sudo systemctl status mongod --no-pager -l

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l

echo ""
echo "=== Backend Logs (last 20 lines) ==="
pm2 logs chessrep-backend --lines 20 --nostream

echo ""
echo "✅ Done! Check the status above to verify everything is running."

