# Fix Guess The Move Page - Games Not Loading

## Issue
Games are not loading on `/guess-the-move` page. Error: `ERR_BLOCKED_BY_CLIENT` and `Failed to fetch`.

## Root Cause
1. Frontend not rebuilt on VPS (still using old `localhost:3001` URLs)
2. PGN files might be missing in `backend/data` directory on VPS
3. Backend route might be failing silently

## Solution Steps

### Step 1: Check if PGN files exist on VPS
```bash
# SSH into VPS
cd /var/www/chessrep/chessrep-main/backend/data
ls -la *.pgn
```

Expected files:
- `beginner_games.pgn`
- `intermediate_games.pgn`
- `master_games.pgn`
- `Kasparov.pgn`
- `Karpov.pgn`

If files are missing, pull from Git:
```bash
cd /var/www/chessrep/chessrep-main
git pull origin main
```

### Step 2: Test the API endpoint directly
```bash
# Test if the route works
curl http://localhost:8001/api/famous-games/all
# Or from outside:
curl http://45.132.241.88/api/famous-games/all
```

If this returns `{"games": []}`, the PGN files are missing or can't be read.

### Step 3: Rebuild Frontend (CRITICAL)
```bash
cd /var/www/chessrep/chessrep-main

# Pull latest code
git fetch origin
git reset --hard origin/main

# Rebuild frontend
cd frontend
rm -rf build
HUSKY=0 npm run build

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Check Backend Logs
```bash
pm2 logs chessrep-backend --lines 50 | grep -i "famous\|pgn\|error"
```

### Step 5: Verify Route is Working
Check if the route is registered:
```bash
# Check server.js includes the route
grep "famous-games" /var/www/chessrep/chessrep-main/backend/server.js
```

Should show: `app.use('/api/famous-games', require('./routes/famousGames'));`

## Files That Feed the Games

The games come from PGN files in `backend/data/`:
- `beginner_games.pgn`
- `intermediate_games.pgn`
- `master_games.pgn`
- `Kasparov.pgn`
- `Karpov.pgn`

The route `/api/famous-games/all` reads all these files and returns a combined list of games.

## If Still Not Working

1. Check browser console for exact error
2. Check Network tab to see if request is being made
3. Verify CORS is allowing the request
4. Check if ad blocker is blocking the request (ERR_BLOCKED_BY_CLIENT)

