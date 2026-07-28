@echo off
setlocal
title WorkBench 个人工作台

cd /d "%~dp0"

if not exist "node_modules\" (
  echo 正在安装首次运行所需的依赖，请稍候...
  call npm install
  if errorlevel 1 (
    echo.
    echo 依赖安装失败。请检查网络连接后再次运行此脚本。
    pause
    exit /b 1
  )
)

echo 正在启动 WorkBench...
call npm run dev

if errorlevel 1 pause
endlocal
