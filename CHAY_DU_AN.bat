@echo off
chcp 65001 >nul
title HOAN Makeup Booking Admin
echo Dang cai dat thu vien...
call npm install
if errorlevel 1 goto error
echo Dang khoi tao co so du lieu local...
call npm run db:migrate:local
if errorlevel 1 goto error
echo Dang khoi dong website...
start "" http://localhost:5173/#/
call npm run dev
goto end
:error
echo Co loi xay ra. Vui long kiem tra Node.js phien ban 22.13 tro len.
pause
:end
