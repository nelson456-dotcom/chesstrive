# Backend Restart Instructions

## Issue
The `/api/coach/status` endpoint is not accessible, likely because the backend server needs to be restarted to load the updated route.

## Solution: Restart the Backend Server

### Step 1: Stop the Current Backend Server
1. Find the terminal/command prompt where the backend is running
2. Press `Ctrl + C` to stop the server

### Step 2: Navigate to Backend Directory
```bash
cd chessrep-main/backend
```

### Step 3: Start the Backend Server
```bash
npm start
```

Or if you're using nodemon:
```bash
npm run dev
```

### Step 4: Verify the Server Started
You should see output like:
```
Server running on port 3001
WebSocket server ready for real-time collaboration
✅ MongoDB Connected Successfully
```

### Step 5: Test the Endpoint
Open a new terminal and test:
```bash
# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/coach/health" -Method GET
```

Or test in your browser:
```
http://localhost:3001/api/coach/health
```

You should see a JSON response with route information.

### Step 6: Test the Coach Status Endpoint
The endpoint should now be accessible at:
```
PUT http://localhost:3001/api/coach/status
```

## Why Restart is Needed

When you add or modify routes in Express.js, the server needs to be restarted to:
1. Load the updated route files
2. Register the new routes with the Express app
3. Make the endpoints available

## Alternative: Use Nodemon for Auto-Restart

If you want the server to automatically restart on file changes:

1. Install nodemon (if not already installed):
```bash
npm install --save-dev nodemon
```

2. Update `package.json` to add a dev script:
```json
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

3. Run with auto-restart:
```bash
npm run dev
```

## Troubleshooting

### If the server won't start:
1. Check if port 3001 is already in use:
   ```bash
   netstat -ano | findstr :3001
   ```
2. Kill the process if needed (replace PID with the process ID):
   ```bash
   taskkill /PID <PID> /F
   ```

### If routes still don't work after restart:
1. Check for syntax errors in `routes/coach.js`
2. Verify the route is registered in `server.js` (line 129)
3. Check the console for any error messages when starting the server

### If you see "Cannot GET /api/coach/health":
- The route file might not be loading
- Check that `routes/coach.js` exists and exports the router correctly
- Verify `module.exports = router;` is at the end of the file








