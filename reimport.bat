@echo off
echo ========================================
echo Lichess Studies Re-import Script
echo ========================================
echo.
echo This will re-import all studies with the fixed parser
echo that correctly handles comments and annotations.
echo.
echo STEP 1: Get your auth token
echo -----------------------------------------
echo 1. Open http://localhost:3000 in your browser
echo 2. Press F12 to open DevTools
echo 3. Go to Console tab
echo 4. Type: localStorage.getItem("token")
echo 5. Copy the token (without quotes)
echo.
set /p TOKEN="Paste your token here: "
echo.
echo STEP 2: Starting re-import...
echo -----------------------------------------
echo.

set AUTH_TOKEN=%TOKEN%
node reimport_studies.js

echo.
echo ========================================
echo Done! Check the output above.
echo ========================================
pause








