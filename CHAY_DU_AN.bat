@echo off
cd /d "%~dp0"
chcp 65001 >nul
title HOAN Makeup - Du lieu online chung voi app
echo Giao dien chay tren may, du lieu doc va luu vao he thong ONLINE chung voi app.
echo Dang nhap bang mat khau quan tri ONLINE.
if not exist "node_modules\vite\package.json" (
  call npm.cmd ci --include=dev
  if errorlevel 1 goto error
)
start "" "http://127.0.0.1:5173/#/admin"
call npm.cmd run dev
if errorlevel 1 goto error
exit /b 0
:error
echo Khong khoi dong duoc. Kiem tra loi o tren hoac dung server cu truoc khi doi che do.
pause
exit /b 1
