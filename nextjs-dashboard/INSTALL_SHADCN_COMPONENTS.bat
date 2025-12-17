@echo off
echo ========================================
echo Installing shadcn/ui Components
echo ========================================
echo.

cd /d "%~dp0"

echo Installing essential components...
call npx shadcn@latest add button
call npx shadcn@latest add card
call npx shadcn@latest add input
call npx shadcn@latest add label
call npx shadcn@latest add alert
call npx shadcn@latest add dropdown-menu
call npx shadcn@latest add avatar

echo.
echo ========================================
echo Components installed!
echo ========================================
pause

