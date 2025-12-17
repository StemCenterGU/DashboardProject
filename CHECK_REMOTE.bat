@echo off
echo ========================================
echo Checking Git Remote Configuration
echo ========================================
echo.

cd /d "%~dp0"

echo Current remote URL:
git remote -v

echo.
echo ========================================
echo.
echo If you see:
echo   git@github.com:AvishManiar21/DashboardProject.git
echo.
echo Then VSCode will push to the NEW repository!
echo.
echo If you see a different URL, run:
echo   git remote set-url origin git@github.com:AvishManiar21/DashboardProject.git
echo.
pause

