#!/bin/bash

# Fix 403 Forbidden Error
# Run this on your VPS

echo "=== FIXING 403 FORBIDDEN ERROR ==="
echo ""

# Step 1: Check if frontend build exists
echo "1. Checking frontend build..."
if [ -f /var/www/chessrep/chessrep-main/frontend/build/index.html ]; then
    echo "✅ index.html exists"
    ls -lh /var/www/chessrep/chessrep-main/frontend/build/index.html
else
    echo "❌ index.html missing! Rebuilding frontend..."
    cd /var/www/chessrep/chessrep-main/frontend
    npm run build
fi
echo ""

# Step 2: Fix permissions on frontend build directory
echo "2. Fixing frontend build permissions..."
sudo chown -R www-data:www-data /var/www/chessrep/chessrep-main/frontend/build
sudo chmod -R 755 /var/www/chessrep/chessrep-main/frontend/build
sudo chmod 644 /var/www/chessrep/chessrep-main/frontend/build/index.html
echo "✅ Permissions fixed"
echo ""

# Step 3: Fix permissions on parent directories
echo "3. Fixing parent directory permissions..."
sudo chown -R www-data:www-data /var/www/chessrep
sudo chmod 755 /var/www
sudo chmod 755 /var/www/chessrep
sudo chmod 755 /var/www/chessrep/chessrep-main
sudo chmod 755 /var/www/chessrep/chessrep-main/frontend
echo "✅ Parent directory permissions fixed"
echo ""

# Step 4: Check Nginx configuration
echo "4. Checking Nginx configuration..."
if [ -f /etc/nginx/sites-available/chessrep ]; then
    echo "✅ Nginx config file exists"
    # Check if root and index are set correctly
    if grep -q "root /var/www/chessrep/chessrep-main/frontend/build" /etc/nginx/sites-available/chessrep; then
        echo "✅ Root directory is correct"
    else
        echo "⚠️ Root directory might be wrong in Nginx config"
    fi
    if grep -q "index index.html" /etc/nginx/sites-available/chessrep; then
        echo "✅ Index directive is set"
    else
        echo "⚠️ Index directive might be missing"
    fi
else
    echo "❌ Nginx config file not found at /etc/nginx/sites-available/chessrep"
fi
echo ""

# Step 5: Test Nginx configuration
echo "5. Testing Nginx configuration..."
sudo nginx -t
echo ""

# Step 6: Restart Nginx
echo "6. Restarting Nginx..."
sudo systemctl restart nginx
echo "✅ Nginx restarted"
echo ""

# Step 7: Verify files are accessible
echo "7. Verifying file accessibility..."
if [ -f /var/www/chessrep/chessrep-main/frontend/build/index.html ]; then
    echo "✅ index.html is readable:"
    sudo -u www-data cat /var/www/chessrep/chessrep-main/frontend/build/index.html | head -5
else
    echo "❌ index.html still missing!"
fi
echo ""

# Step 8: Check Nginx error log
echo "8. Recent Nginx errors:"
sudo tail -10 /var/log/nginx/error.log
echo ""

echo "=== FIX COMPLETE ==="
echo "If still getting 403, check:"
echo "1. sudo tail -f /var/log/nginx/error.log"
echo "2. ls -la /var/www/chessrep/chessrep-main/frontend/build/"
echo "3. sudo nginx -t"

