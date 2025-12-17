@echo off
cd /d "%~dp0"
git init
git add .
git commit -m "Initial commit - DashboardProject"
git remote remove origin 2>nul
git remote add origin git@github.com:AvishManiar21/DashboardProject.git
git branch -M main
git push -u origin main
pause

