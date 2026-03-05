@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo   Git 一键更新本地仓库
echo ============================================
echo.

:: 检查 git 是否可用
where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] 未找到 Git，请先安装 Git: https://git-scm.com
  pause
  exit /b 1
)

:: 检查是否在 git 仓库中
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [ERROR] 当前目录不是 Git 仓库
  pause
  exit /b 1
)

:: 显示当前分支
for /f "tokens=*" %%b in ('git branch --show-current') do set "BRANCH=%%b"
echo [INFO] 当前分支: %BRANCH%
echo.

:: 检查是否有未提交的更改
git diff --quiet >nul 2>&1
set "HAS_UNSTAGED=%errorlevel%"
git diff --cached --quiet >nul 2>&1
set "HAS_STAGED=%errorlevel%"

if %HAS_UNSTAGED% neq 0 (
  echo [WARN] 检测到未暂存的本地修改，将自动 stash 保存...
  set "NEED_STASH=1"
)
if %HAS_STAGED% neq 0 (
  echo [WARN] 检测到已暂存的本地修改，将自动 stash 保存...
  set "NEED_STASH=1"
)

if defined NEED_STASH (
  git stash push -m "auto-stash before git-update %date% %time%"
  if errorlevel 1 (
    echo [ERROR] Stash 失败，请手动处理后重试
    pause
    exit /b 1
  )
  echo [OK] 本地修改已暂存保存
  echo.
)

:: 拉取远程最新内容
echo [INFO] 正在从远程拉取最新内容...
git pull --rebase origin %BRANCH%
set "PULL_RESULT=%errorlevel%"

if %PULL_RESULT% neq 0 (
  echo.
  echo [ERROR] 拉取失败，可能存在冲突
  echo         请手动解决冲突后运行: git rebase --continue
  if defined NEED_STASH (
    echo         冲突解决后别忘了恢复 stash: git stash pop
  )
  pause
  exit /b 1
)

echo [OK] 拉取成功
echo.

:: 恢复之前 stash 的内容
if defined NEED_STASH (
  echo [INFO] 正在恢复之前暂存的本地修改...
  git stash pop
  if errorlevel 1 (
    echo [WARN] Stash 恢复时出现冲突，请手动解决
    echo        查看 stash 列表: git stash list
    pause
    exit /b 1
  )
  echo [OK] 本地修改已恢复
  echo.
)

:: 显示最终状态
echo ============================================
echo   更新完成！当前状态:
echo ============================================
git log --oneline -3
echo.
git status -s
echo.
pause
