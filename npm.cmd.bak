@echo off
setlocal EnableDelayedExpansion

:: 将 Node 安装目录加入当前会话 PATH
set "NODE_DIR="
if exist "C:\Program Files\nodejs\node.exe" set "NODE_DIR=C:\Program Files\nodejs"
if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_DIR=C:\Program Files (x86)\nodejs"
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_DIR=%ProgramFiles%\nodejs"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_DIR=%ProgramFiles(x86)%\nodejs"
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_DIR=%LOCALAPPDATA%\Programs\nodejs"

if not defined NODE_DIR (
  echo [ERROR] Node.js not found. Add Node to PATH or use full path to npm.
  exit /b 1
)
set "PATH=!NODE_DIR!;!PATH!"

:: 调用真正的 npm，并传入所有参数
"!NODE_DIR!\npm.cmd" %*
