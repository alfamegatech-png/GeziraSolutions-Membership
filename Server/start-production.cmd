@echo off
setlocal
cd /d "%~dp0"
if not exist ".next\BUILD_ID" (
  echo Production build missing. Run npm run build first while the application is stopped.
  exit /b 1
)
set "NODE_ENV=production"
if not defined PORT set "PORT=3001"
call npm start -- -p %PORT%
exit /b %errorlevel%
