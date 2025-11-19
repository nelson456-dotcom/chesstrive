# Fix Studies Issue - Diagnosis & Solutions

## Problem
- Studies created by `adminiz1` are missing
- Creating new studies fails with "Failed to create study" error

## Quick Diagnosis

### Step 1: Check if MongoDB is running
```bash
cd chessrep-main/backend
node diagnose-studies.js adminiz1
```

This will show you:
- ✅ MongoDB connection status
- 📚 All studies in the database
- 👤 All users
- 🔍 Studies for the specific user (`adminiz1`)

### Step 2: Check Backend Health
Open in your browser or use curl:
```
http://localhost:3001/api/health
```

This will show:
- MongoDB connection status
- Database name
- Server uptime

## Common Solutions

### Solution 1: MongoDB Not Running

**Symptoms:**
- `MongoNetworkError` or `MongooseServerSelectionError`
- "Database connection error" message

**Fix:**

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run MongoDB manually
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe" --dbpath "C:\data\db"
```

**Mac/Linux:**
```bash
# Start MongoDB service
sudo service mongod start

# Or with Homebrew (Mac)
brew services start mongodb-community

# Or run manually
mongod --dbpath /path/to/your/data/directory
```

### Solution 2: Wrong Database or Connection String

**Check your `.env` file:**
```bash
cd chessrep-main/backend
cat .env  # Mac/Linux
type .env # Windows
```

Make sure `MONGODB_URI` is set correctly:
```
MONGODB_URI=mongodb://localhost:27017/chessrep
```

### Solution 3: User Authentication Issue

If MongoDB is running but studies still don't appear:

**Check if you're logged in:**
1. Open browser console (F12)
2. Go to Application/Storage → Local Storage
3. Check if `token` exists
4. If not, log in again

**Check user ID:**
1. Open browser console
2. Run:
```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('User ID:', payload.user.id);
```

### Solution 4: Database Data Lost

If MongoDB was running without `--dbpath` or data directory was deleted:

**Restore from backup (if you have one):**
```bash
mongorestore --db chessrep /path/to/backup
```

**Or start fresh:**
1. Create new account
2. Create new studies

## Enhanced Logging

The backend now has enhanced logging that will help diagnose issues:

### Creating a Study:
```
📝 Creating new study...
User ID: 67567567567567567567
Request body: { name: 'My Study', ... }
✅ Creating study document...
💾 Saving study to database...
✅ Study saved successfully: 67567567567567567568
```

### Fetching Studies:
```
📚 Fetching studies for user: 67567567567567567567
✅ Found 3 studies for user 67567567567567567567
📦 Returning studies with chapters: 3
```

### Error Example:
```
❌ ERROR creating study: Connection timeout
Error details: {
  message: 'Server selection timed out after 5000 ms',
  name: 'MongooseServerSelectionError',
  ...
}
```

## Prevent Future Issues

### 1. Always Start MongoDB First
Before starting the backend:
```bash
# Terminal 1: Start MongoDB
mongod --dbpath /path/to/data

# Terminal 2: Start Backend
cd chessrep-main/backend
npm start
```

### 2. Use Process Manager (Production)
```bash
# Install PM2
npm install -g pm2

# Start MongoDB with PM2
pm2 start mongod --name mongodb -- --dbpath /path/to/data

# Start Backend with PM2
pm2 start server.js --name chessrep-backend
```

### 3. Regular Backups
```bash
# Backup database
mongodump --db chessrep --out /path/to/backup/$(date +%Y%m%d)

# Restore if needed
mongorestore --db chessrep /path/to/backup/20241201
```

## Need More Help?

1. Check backend terminal for error messages
2. Check browser console for frontend errors
3. Run the diagnostic script: `node diagnose-studies.js adminiz1`
4. Check `/api/health` endpoint for system status




