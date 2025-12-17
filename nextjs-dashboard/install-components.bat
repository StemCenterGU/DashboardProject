@echo off
echo ========================================
echo Installing shadcn/ui Components
echo ========================================
echo.

cd /d "%~dp0"

echo Installing button...
call npx shadcn@latest add button -y

echo Installing card...
call npx shadcn@latest add card -y

echo Installing input...
call npx shadcn@latest add input -y

echo Installing label...
call npx shadcn@latest add label -y

echo Installing alert...
call npx shadcn@latest add alert -y

echo Installing dropdown-menu...
call npx shadcn@latest add dropdown-menu -y

echo Installing avatar...
call npx shadcn@latest add avatar -y

echo.
echo ========================================
echo All components installed!
echo ========================================
echo.
echo Now restart your dev server: npm run dev
echo.
pause

