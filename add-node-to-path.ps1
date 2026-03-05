# 将 Node.js 安装目录加入当前用户的 PATH（永久生效）
# 运行后请关闭并重新打开终端，即可直接使用 npm

$nodePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
)

$nodeDir = $null
foreach ($p in $nodePaths) {
    if (Test-Path "$p\node.exe") {
        $nodeDir = $p
        break
    }
}

if (-not $nodeDir) {
    Write-Host "[ERROR] Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -like "*$nodeDir*") {
    Write-Host "[OK] Node is already in your PATH: $nodeDir" -ForegroundColor Green
    exit 0
}

$newPath = "$userPath;$nodeDir"
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
Write-Host "[OK] Added to PATH (User): $nodeDir" -ForegroundColor Green
Write-Host ""
Write-Host "Please CLOSE this terminal and OPEN A NEW one, then run: npm install" -ForegroundColor Yellow
