@echo off
cd /d "%~dp0..\.."
chcp 65001 >nul
title HOAN Makeup - Tao IPA
echo Build IPA tu nhanh da commit va push len GitHub.
echo Ban moi se nam trong IPA, ban cu duoc giu trong IPA\archive.
if not exist "node_modules\fflate\package.json" (
  call npm.cmd ci --include=dev
  if errorlevel 1 goto error
)
call npm.cmd run ipa:build
if errorlevel 1 goto error
echo IPA da duoc kiem tra va luu trong thu muc IPA.
pause
exit /b 0
:error
echo Build chua thanh cong. Xem thong bao va link GitHub o tren.
pause
exit /b 1
