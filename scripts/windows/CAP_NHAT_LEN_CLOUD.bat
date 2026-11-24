@echo off
chcp 65001 >nul
title HOAN Makeup - Cap Nhat Code & Giao Dien Len Cloud
echo =====================================================================
echo    HOAN MAKEUP - CAP NHAT HE THONG LEN CLOUD CHAY 24/24
echo =====================================================================
echo.
echo [1] Dang dong goi du an (Build Next/Vite)...
cd /d "%~dp0..\.."
call npm.cmd run build
if errorlevel 1 (
    echo [Loi] Build that bai, vui long kiem tra code.
    pause
    exit /b
)
echo.
echo [2] Dang day ban moi nhat len Cloudflare...
call npx wrangler deploy
if errorlevel 1 (
    echo [Loi] Deploy that bai.
    pause
    exit /b
)
echo.
echo =====================================================================
echo    DA TRIEN KHAI BAN BUILD LEN CLOUDFLARE.
echo    Link website 24/24: https://hoan-makeup-artist.hoan-makeup.workers.dev/
echo =====================================================================
echo.
pause
