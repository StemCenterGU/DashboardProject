@echo off
echo ========================================
echo Fixing All Next.js Errors
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Stopping dev server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Clearing Next.js cache...
if exist .next (
    rmdir /s /q .next
    echo .next folder deleted!
) else (
    echo .next folder not found
)

echo.
echo Step 3: Clearing node_modules cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo Cache cleared!
)

echo.
echo Step 4: Verifying environment variables...
if exist .env.local (
    echo .env.local found
) else (
    echo WARNING: .env.local not found!
    echo Make sure you have:
    echo   NEXT_PUBLIC_SUPABASE_URL=...
    echo   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
)

echo.
echo Step 5: Checking required files...
if exist lib\supabase.ts (echo [OK] lib\supabase.ts) else (echo [MISSING] lib\supabase.ts)
if exist lib\supabase-server.ts (echo [OK] lib\supabase-server.ts) else (echo [MISSING] lib\supabase-server.ts)
if exist lib\utils.ts (echo [OK] lib\utils.ts) else (echo [MISSING] lib\utils.ts)
if exist components\navbar.tsx (echo [OK] components\navbar.tsx) else (echo [MISSING] components\navbar.tsx)
if exist app\globals.css (echo [OK] app\globals.css) else (echo [MISSING] app\globals.css)

echo.
echo ========================================
echo Fix complete! Now run:
echo   npm run dev
echo ========================================
echo.
echo IMPORTANT: Check browser console (F12) for the exact file path that's missing!
echo.
pause

