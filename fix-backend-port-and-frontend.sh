#!/bin/bash

# Fix 500 Error: Backend Port Mismatch and Frontend Build Issues
# Run this on your VPS

echo "=== FIXING 500 ERROR ==="
echo ""

# Step 1: Check current backend .env
echo "1. Checking backend .env file..."
cd /var/www/chessrep/chessrep-main/backend
if [ -f .env ]; then
    echo "Current PORT in .env:"
    grep PORT .env || echo "PORT not set in .env"
else
    echo "❌ .env file not found!"
fi
echo ""

# Step 2: Set PORT to 8001 in backend .env
echo "2. Setting PORT=8001 in backend .env..."
if [ -f .env ]; then
    # Remove existing PORT line if it exists
    sed -i '/^PORT=/d' .env
    # Add PORT=8001
    echo "PORT=8001" >> .env
    echo "✅ PORT set to 8001"
else
    echo "Creating .env file..."
    echo "PORT=8001" > .env
    echo "✅ Created .env with PORT=8001"
fi
echo ""

# Step 3: Check if frontend build exists
echo "3. Checking frontend build..."
cd /var/www/chessrep/chessrep-main/frontend
if [ -f build/index.html ]; then
    echo "✅ index.html exists"
    ls -lh build/index.html
else
    echo "❌ index.html missing! Rebuilding frontend..."
    npm run build
fi
echo ""

# Step 4: Fix frontend build permissions
echo "4. Fixing frontend build permissions..."
sudo chown -R www-data:www-data /var/www/chessrep/chessrep-main/frontend/build
sudo chmod -R 755 /var/www/chessrep/chessrep-main/frontend/build
echo "✅ Permissions fixed"
echo ""

# Step 5: Stop and restart backend
echo "5. Restarting backend with new PORT..."
pm2 stop chessrep-backend
pm2 delete chessrep-backend
cd /var/www/chessrep/chessrep-main/backend
pm2 start server.js --name chessrep-backend
pm2 save
echo "✅ Backend restarted"
echo ""

# Step 6: Wait a moment and check if backend is listening
echo "6. Checking if backend is listening on port 8001..."
sleep 3
if sudo lsof -i :8001 | grep -q LISTEN; then
    echo "✅ Backend is listening on port 8001"
else
    echo "❌ Backend is NOT listening on port 8001"
    echo "Checking backend logs..."
    pm2 logs chessrep-backend --lines 20 --nostream
fi
echo ""

# Step 7: Test backend health
echo "7. Testing backend health endpoint..."
curl -s http://localhost:8001/api/health || echo "❌ Backend not responding"
echo ""

# Step 8: Restart Nginx
echo "8. Restarting Nginx..."
sudo systemctl restart nginx
echo "✅ Nginx restarted"
echo ""

# Step 9: Final status check
echo "=== FINAL STATUS ==="
pm2 status
echo ""
echo "Backend listening on port 8001:"
sudo lsof -i :8001 | grep LISTEN || echo "❌ Not listening"
echo ""
echo "Frontend build exists:"
[ -f /var/www/chessrep/chessrep-main/frontend/build/index.html ] && echo "✅ Yes" || echo "❌ No"
echo ""
echo "✅ Fix complete! Check the status above."

