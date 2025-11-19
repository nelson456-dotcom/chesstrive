# Testing Coach Endpoint

## Quick Test Steps

### 1. Test Backend Directly (Bypass Proxy)

Open your browser and go to:
```
http://localhost:3001/api/coach/health
```

**Expected**: JSON response with route information

If this works, the backend is running correctly.

### 2. Test Through Proxy

Open your browser and go to:
```
http://localhost:3000/api/coach/health
```

**Expected**: Same JSON response (going through React dev server proxy)

If this doesn't work, the proxy might not be configured correctly.

### 3. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Become a Coach" button
4. Look for the request to `/api/coach/status`
5. Check:
   - Request URL (should be `http://localhost:3000/api/coach/status`)
   - Request Method (should be PUT)
   - Response Status
   - Response Headers (Content-Type should be application/json)

### 4. Check Frontend Console

Look for logs starting with `[Coach Status]`:
- `[Coach Status] Making request to: /api/coach/status`
- `[Coach Status] Response received: {...}`

## Common Issues

### Issue: "Backend server is not responding"
**Possible causes:**
1. Frontend dev server needs restart (to pick up proxy changes)
2. Proxy not forwarding correctly
3. Backend route not registered

**Solution:**
1. Restart frontend dev server:
   ```bash
   # Stop frontend (Ctrl+C)
   cd chessrep-main/frontend
   npm start
   ```

2. Verify proxy is working:
   - Check `setupProxy.js` exists
   - Check browser console for proxy errors

### Issue: Getting HTML instead of JSON
**Possible causes:**
1. Proxy error handler returning HTML
2. Backend returning HTML error page

**Solution:**
- Check `setupProxy.js` - should return JSON on error
- Check backend logs for errors

### Issue: 404 Not Found
**Possible causes:**
1. Route not registered in server.js
2. Route file has syntax errors

**Solution:**
- Verify `app.use('/api/coach', require('./routes/coach'));` in server.js
- Check backend console for route loading errors

## Manual Test with curl (PowerShell)

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:3001/api/coach/health" -Method GET

# Test status endpoint (requires auth token)
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}
$body = @{ isCoach = $true } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/api/coach/status" -Method PUT -Headers $headers -Body $body
```








