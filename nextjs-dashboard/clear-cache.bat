@echo off
echo ========================================
echo Clearing Next.js Cache
echo ========================================
echo.

cd /d "%~dp0"

echo Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul

echo.
echo Removing .next folder...
if exist .next (
    rmdir /s /q .next
    echo .next folder deleted!
) else (
    echo .next folder not found (already clean)
)

echo.
echo Removing node_modules/.cache if exists...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo Cache cleared!
)

echo.
echo ========================================
echo Cache cleared! Now restart:
echo   npm run dev
echo ========================================
pause

