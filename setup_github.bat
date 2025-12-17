@echo off
echo ========================================
echo GitHub Setup Script
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if git is installed...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Git is installed!
echo.

echo Checking if git is initialized...
if exist .git (
    echo Git is already initialized.
) else (
    echo Initializing git repository...
    git init
)

echo.
echo ========================================
echo IMPORTANT: Before continuing...
echo ========================================
echo.
echo 1. Make sure you've created a NEW repository on GitHub
echo    Log in as: AvishManiar21
echo    Create repo at: https://github.com/new
echo    Name it: stem-face-dashboard (or your choice)
echo    Make it PRIVATE
echo    DO NOT initialize with README
echo.
echo 2. After creating the repo, GitHub will show you commands
echo    OR tell me the repository URL and I'll help you push
echo.
echo 3. What's your repository URL?
echo    Example: https://github.com/AvishManiar21/stem-face-dashboard
echo.
pause

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit - recovered project from disabled Google account"

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Set your git username (if not already set):
echo    git config --global user.name "AvishManiar21"
echo.
echo 2. Set your git email:
echo    git config --global user.email "YOUR_EMAIL@example.com"
echo.
echo 3. Add remote repository (replace REPO_URL with your actual URL):
echo    git remote add origin https://github.com/AvishManiar21/stem-face-dashboard.git
echo.
echo 4. Push to GitHub:
echo    git branch -M main
echo    git push -u origin main
echo.
echo ========================================
pause

