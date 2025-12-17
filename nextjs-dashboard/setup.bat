@echo off
echo ========================================
echo Next.js Dashboard Setup
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Installing tailwindcss-animate...
call npm install -D tailwindcss-animate
if errorlevel 1 (
    echo WARNING: tailwindcss-animate installation failed, but continuing...
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create .env.local file with Supabase credentials
echo 2. Run: npx shadcn-ui@latest init
echo 3. Run: npm run dev
echo.
pause

