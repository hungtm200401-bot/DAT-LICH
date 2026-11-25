@echo off
cd /d "%~dp0..\.."
chcp 65001 >nul
title HOAN Makeup - Thu nghiem local
echo BAN THU NGHIEM TREN MAY - du lieu rieng, khong phai du lieu app iPhone.
echo Dung CHAY_DU_AN.bat o thu muc goc de quan tri du lieu online.
if not exist "node_modules\vite\package.json" (
  echo Dang cai dat thu vien theo package-lock.json...
  call npm.cmd ci --include=dev
  if errorlevel 1 goto error
)
echo Dang khoi tao co so du lieu local...
call npm.cmd run db:migrate:local
if errorlevel 1 goto error
call node scripts\admin-key.mjs --init
if errorlevel 1 goto error
echo Dang khoi dong website thu nghiem...
start "" http://127.0.0.1:5173/#/
call npm.cmd run dev
goto end
:error
echo Co loi xay ra. Vui long kiem tra Node.js phien ban 22.13 tro len.
pause
:end
