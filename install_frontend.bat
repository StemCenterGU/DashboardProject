@echo off
echo Installing Next.js Frontend...
echo.
call npx -y create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
echo.
echo Installation complete. You can close this window.
pause
