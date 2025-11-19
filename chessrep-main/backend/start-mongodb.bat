@echo off
echo Starting MongoDB for ChessRep...
echo.

REM Check if MongoDB is already running
netstat -an | findstr :27017 >nul
if %errorlevel% == 0 (
    echo MongoDB is already running on port 27017
    echo.
    pause
    exit /b 0
)

REM Try to start MongoDB
echo Attempting to start MongoDB...
echo.

REM Try different common MongoDB installation paths
set MONGODB_PATHS[0]="C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
set MONGODB_PATHS[1]="C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
set MONGODB_PATHS[2]="C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
set MONGODB_PATHS[3]="C:\MongoDB\bin\mongod.exe"
set MONGODB_PATHS[4]="C:\mongodb\bin\mongod.exe"

REM Try to find MongoDB executable
for /L %%i in (0,1,4) do (
    call set MONGODB_PATH=%%MONGODB_PATHS[%%i]%%
    if exist !MONGODB_PATH! (
        echo Found MongoDB at: !MONGODB_PATH!
        echo Starting MongoDB with default data directory...
        start "MongoDB" !MONGODB_PATH! --dbpath "C:\data\db"
        echo.
        echo MongoDB started! You can now run your ChessRep application.
        echo.
        pause
        exit /b 0
    )
)

echo MongoDB not found in common installation paths.
echo.
echo Please install MongoDB from: https://www.mongodb.com/try/download/community
echo Or if MongoDB is installed, add it to your PATH environment variable.
echo.
echo Alternative: You can start MongoDB manually by running:
echo mongod --dbpath C:\data\db
echo.
pause


