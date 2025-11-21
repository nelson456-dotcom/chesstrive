#!/bin/bash

# Fix puzzles not loading on endgame-trainer and puzzles pages
# Run this on your VPS

echo "=== FIXING PUZZLES NOT LOADING ==="
echo ""

# Step 1: Check backend is running
echo "1. Checking backend status..."
if pm2 list | grep -q "backend.*online"; then
    echo "✅ Backend is running"
    pm2 list | grep backend
else
    echo "❌ Backend is not running!"
    echo "Starting backend..."
    cd /var/www/chessrep/chessrep-main/backend
    pm2 start server.js --name backend
fi
echo ""

# Step 2: Check backend logs for errors
echo "2. Recent backend errors:"
pm2 logs backend --lines 20 --nostream | grep -i "error\|failed\|404\|500" | tail -10
echo ""

# Step 3: Test API endpoints
echo "3. Testing API endpoints..."
echo "Testing /api/endgames/random (requires auth token):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://127.0.0.1:8001/api/endgames/random || echo "❌ Endpoint not accessible"
echo ""

echo "Testing /api/puzzles/themes:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://127.0.0.1:8001/api/puzzles/themes || echo "❌ Endpoint not accessible"
echo ""

# Step 4: Check MongoDB connection
echo "4. Checking MongoDB connection..."
cd /var/www/chessrep/chessrep-main/backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';
mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ MongoDB connected');
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"
echo ""

# Step 5: Check if endgame puzzles are loaded
echo "5. Checking endgame puzzles in database..."
cd /var/www/chessrep/chessrep-main/backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';
mongoose.connect(mongoURI)
  .then(async () => {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const hasEndgames = collections.some(c => c.name === 'endgames' || c.name === 'puzzles');
    console.log('Collections:', collections.map(c => c.name).join(', '));
    if (hasEndgames) {
      const Puzzle = mongoose.model('Puzzle', new mongoose.Schema({}, { strict: false }), 'puzzles');
      const count = await Puzzle.countDocuments({ theme: { \$in: ['endgame', 'pawn_endgame', 'rook_endgame'] } });
      console.log('Endgame puzzles in database:', count);
    }
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.log('Error:', err.message);
    process.exit(1);
  });
"
echo ""

# Step 6: Rebuild frontend
echo "6. Rebuilding frontend..."
cd /var/www/chessrep/chessrep-main/frontend
rm -rf build
npm run build
echo "✅ Frontend rebuilt"
echo ""

# Step 7: Restart services
echo "7. Restarting services..."
pm2 restart backend
sudo systemctl reload nginx
echo "✅ Services restarted"
echo ""

echo "=== FIX COMPLETE ==="
echo "Check browser console for errors:"
echo "1. Open https://chesstrive.com/endgame-trainer"
echo "2. Open browser DevTools (F12)"
echo "3. Check Console tab for errors"
echo "4. Check Network tab for failed API calls"

