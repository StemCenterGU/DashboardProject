@echo off
echo ========================================
echo Pushing Code to GitHub
echo Repository: DashboardProject
echo ========================================
echo.

cd /d "%~dp0"

echo Checking git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Install from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo Step 1: Initializing git repository...
if exist .git (
    echo Git already initialized.
) else (
    git init
    echo Git initialized!
)

echo.
echo Step 2: Adding all files...
git add .
echo Files added!

echo.
echo Step 3: Creating commit...
git commit -m "Initial commit - DashboardProject"
if errorlevel 1 (
    echo Note: Commit might have failed if no changes detected.
    echo This is OK if files are already committed.
)

echo.
echo Step 4: Adding remote repository...
git remote remove origin 2>nul
git remote add origin git@github.com:AvishManiar21/DashboardProject.git
echo Remote added!

echo.
echo Step 5: Setting branch to main...
git branch -M main

echo.
echo ========================================
echo Ready to push!
echo ========================================
echo.
echo IMPORTANT: Make sure you have SSH keys set up!
echo If you get authentication errors, you may need to:
echo 1. Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
echo 2. OR use HTTPS instead: git remote set-url origin https://github.com/AvishManiar21/DashboardProject.git
echo.
pause

echo.
echo Step 6: Pushing to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo Push failed! Common issues:
    echo ========================================
    echo.
    echo 1. SSH keys not set up - Use HTTPS instead:
    echo    git remote set-url origin https://github.com/AvishManiar21/DashboardProject.git
    echo    git push -u origin main
    echo.
    echo 2. Need to authenticate - GitHub will prompt you
    echo.
    echo 3. Repository might not exist - Double-check the URL
    echo.
) else (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo View your repository at:
    echo https://github.com/AvishManiar21/DashboardProject
    echo.
)

pause

