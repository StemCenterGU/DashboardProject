@echo off
echo Starting setup... > setup.log
call npx -y create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm >> setup.log 2>&1
echo Done. >> setup.log
