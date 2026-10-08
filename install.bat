@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [错误] 未检测到 Node.js 运行环境！
    echo 本汉化补丁需要 Node.js (建议 v18+)。请访问 https://nodejs.org/ 安装后重试。
    echo.
    pause
    exit /b 1
)

node install.js %*

if errorlevel 1 (
    echo.
    echo [提示] 操作未完成或遇到异常，请检查上方日志。
    echo 如需体检诊断，可执行：install.bat --doctor
    echo 如需还原原版，可执行：install.bat --restore
    echo.
)

pause

