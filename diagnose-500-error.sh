#!/bin/bash

# Diagnose 500 Internal Server Error
# Run this on your VPS to see what's actually wrong

echo "=== DIAGNOSING 500 ERROR ==="
echo ""

echo "1. Checking PM2 status..."
pm2 status
echo ""

echo "2. Checking backend logs (last 50 lines)..."
pm2 logs chessrep-backend --lines 50 --nostream
echo ""

echo "3. Checking if backend is listening on port 8001..."
sudo lsof -i :8001 || echo "❌ Nothing listening on port 8001"
echo ""

echo "4. Testing backend health endpoint..."
curl -v http://localhost:8001/api/health 2>&1 || echo "❌ Backend not responding"
echo ""

echo "5. Checking MongoDB status..."
sudo systemctl status mongod --no-pager -l | head -20
echo ""

echo "6. Checking Nginx error logs (last 20 lines)..."
sudo tail -20 /var/log/nginx/error.log
echo ""

echo "7. Checking if backend process is running..."
ps aux | grep "node.*server.js" | grep -v grep || echo "❌ Backend process not found"
echo ""

echo "8. Checking backend directory and files..."
ls -la /var/www/chessrep/chessrep-main/backend/server.js
echo ""

echo "9. Checking backend .env file exists..."
if [ -f /var/www/chessrep/chessrep-main/backend/.env ]; then
    echo "✅ .env file exists"
    echo "Checking MONGO_URL..."
    grep MONGO_URL /var/www/chessrep/chessrep-main/backend/.env | head -1
else
    echo "❌ .env file missing!"
fi
echo ""

echo "10. Testing MongoDB connection..."
cd /var/www/chessrep/chessrep-main/backend
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep').then(() => { console.log('✅ MongoDB connected'); process.exit(0); }).catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });"
echo ""

echo "=== DIAGNOSIS COMPLETE ==="
echo "Look for ❌ errors above to identify the problem"

