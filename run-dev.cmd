@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: 将常见 Node 安装目录加入当前会话 PATH（按顺序尝试，找到即用）
set "NODE_DIR="
if exist "C:\Program Files\nodejs\node.exe" set "NODE_DIR=C:\Program Files\nodejs"
if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_DIR=C:\Program Files (x86)\nodejs"
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_DIR=%ProgramFiles%\nodejs"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_DIR=%ProgramFiles(x86)%\nodejs"
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_DIR=%LOCALAPPDATA%\Programs\nodejs"

if defined NODE_DIR (
  set "PATH=!NODE_DIR!;!PATH!"
  echo [OK] Using Node: !NODE_DIR!
) else (
  echo [WARN] Node not found in common paths. Trying current PATH...
)

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js not found. Please:
  echo   1. Install Node from https://nodejs.org
  echo   2. Or add Node to system PATH, e.g. C:\Program Files\nodejs
  echo.
  pause
  exit /b 1
)

echo Node: 
node -v
echo npm:
call npm -v
echo.

if not exist "node_modules\.bin\vite.cmd" (
  echo [INFO] Running npm install...
  call npm install
  echo.
)

echo Starting dev server...
call npm run dev
pause
