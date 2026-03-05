@echo off
:: 将 Node 加入系统 PATH，运行一次后新开终端即可直接用 npm
echo Adding Node.js to your PATH...
echo.
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0add-node-to-path.ps1"
echo.
pause
