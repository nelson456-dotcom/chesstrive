# 🔄 RESTART BACKEND SERVER

## The Problem:
You're getting: `Error creating post: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

This means the backend server hasn't loaded the new `/api/posts` route yet.

## ✅ SOLUTION - Restart Backend Server:

### Step 1: Stop the Backend
1. Go to the terminal where backend is running
2. Press `Ctrl + C` to stop the server
3. Wait for it to fully stop

### Step 2: Start the Backend Again
```bash
cd "C:\Users\Nizar\Desktop\chessrep-main - Copy\chessrep-main\backend"
npm start
```

OR if using nodemon:
```bash
cd "C:\Users\Nizar\Desktop\chessrep-main - Copy\chessrep-main\backend"
nodemon server.js
```

### Step 3: Verify Server Started
You should see:
```
✅ MongoDB Connected
✅ Server running on port 3001
```

### Step 4: Test the API
Open browser and go to:
```
http://localhost:3001/api/test
```

You should see:
```json
{"message":"Server is running!"}
```

### Step 5: Test Posts Endpoint
In browser console (F12), run:
```javascript
fetch('http://localhost:3001/api/posts')
  .then(r => r.json())
  .then(d => console.log('Posts:', d))
```

You should see the test post!

### Step 6: Try Posting Again
1. Go to `http://localhost:3000/feed`
2. Type a message
3. Click "Post"
4. Should work now! ✅

---

## If Still Not Working:

### Check if backend is actually running:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### Kill all Node processes and restart:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

Then start backend again:
```bash
cd backend
npm start
```

---

## Quick Test Script:

Run this in backend directory to test if routes work:
```bash
node -e "const app = require('./server'); console.log('Server loaded successfully');"
```

---

**After restarting, the feed posting will work perfectly!** 🎉











