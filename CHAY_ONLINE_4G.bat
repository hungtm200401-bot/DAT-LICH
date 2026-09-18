@echo off
chcp 65001 >nul
title HOAN Makeup - Kich Hoat Truy Cap Online 4G/5G Toan Cau
echo =====================================================================
echo    HOAN MAKEUP - KICH HOAT DUONG TRUYEN TRUY CAP ONLINE 4G/5G
echo =====================================================================
echo.
echo [1] Dang kiem tra ket noi den may chu cuc bo (http://127.0.0.1:5173)...
echo [2] Dang khoi tao Cloudflare Secure Tunnel...
echo.
echo LUU Y:
echo - Giu cua so nay mo de tiep tuc duy tri link online.
echo - Dien thoai bat ky (dung 4G/5G hoac Wifi khac) co the truy cap ngay!
echo.
echo =====================================================================
echo.
cd /d "%~dp0"
cloudflared.exe tunnel --url http://127.0.0.1:5173
pause
