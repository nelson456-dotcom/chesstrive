# MongoDB Setup for ChessRep

## The Problem
Your ChessRep application is experiencing timeout errors because MongoDB is not running. The errors you're seeing:

```
MongooseError: Operation `puzzles.distinct()` buffering timed out after 10000ms
MongooseError: Operation `puzzles.find()` buffering timed out after 10000ms
MongooseError: Operation `puzzles.countDocuments()` buffering timed out after 10000ms
```

These occur because the application cannot connect to MongoDB.

## Quick Fix (Temporary)
I've updated the puzzle routes to provide fallback data when MongoDB is not available. Your application will now work with sample puzzles even without MongoDB running.

## Permanent Solution: Start MongoDB

### Option 1: Use the provided script
1. Double-click `start-mongodb.bat` in the backend folder
2. This will attempt to find and start MongoDB automatically

### Option 2: Manual setup
1. **Install MongoDB** (if not already installed):
   - Download from: https://www.mongodb.com/try/download/community
   - Choose "Windows" and "msi" installer
   - Follow the installation wizard

2. **Create data directory**:
   ```cmd
   mkdir C:\data\db
   ```

3. **Start MongoDB**:
   ```cmd
   mongod --dbpath C:\data\db
   ```

4. **Verify MongoDB is running**:
   - Open a new command prompt
   - Run: `netstat -an | findstr :27017`
   - You should see port 27017 listening

### Option 3: Use MongoDB as a Windows Service
1. Install MongoDB with the "Install MongoDB as a Service" option
2. The service will start automatically with Windows
3. No manual startup required

## Verify the Fix
After starting MongoDB:
1. Restart your ChessRep backend server
2. Check the console for: `✅ MongoDB Connected Successfully`
3. The puzzle routes should now work without timeouts

## Database Location
- **Connection String**: `mongodb://127.0.0.1:27017/chessrep`
- **Data Directory**: `C:\data\db` (default)
- **Database Name**: `chessrep`

## Troubleshooting
- **Port already in use**: Another MongoDB instance might be running
- **Permission denied**: Run command prompt as Administrator
- **Data directory not found**: Create `C:\data\db` directory manually
- **MongoDB not found**: Add MongoDB bin directory to your PATH environment variable

## Fallback Mode
Even without MongoDB, the application now provides:
- Sample puzzle themes
- Fallback puzzles for testing
- Graceful error handling

This ensures your frontend continues to work while you set up MongoDB.


