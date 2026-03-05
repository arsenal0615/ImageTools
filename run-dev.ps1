# 将常见 Node 安装目录加入当前会话，再启动开发服务器
$nodePaths = @(
  "C:\Program Files\nodejs",
  "C:\Program Files (x86)\nodejs",
  "$env:APPDATA\npm"
)

$env:PATH = ($nodePaths + $env:PATH -split [IO.Path]::PathSeparator | Select-Object -Unique) -join [IO.Path]::PathSeparator

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[ERROR] Node.js not found. Please add Node installation directory to system PATH." -ForegroundColor Red
  Write-Host "Common: C:\Program Files\nodejs" -ForegroundColor Yellow
  exit 1
}

Write-Host "Node: $(node -v)"
Write-Host "npm: $(npm -v)"
Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Green
npm run dev
