@echo off
cd /d "%~dp0"
chcp 65001 >nul
title HOAN Makeup - Quan tri online
echo Dang mo quan tri ONLINE, cung may chu va du lieu voi app iPhone.
echo https://hoan-makeup-artist.hoan-makeup.workers.dev/#/admin
start "" "https://hoan-makeup-artist.hoan-makeup.workers.dev/#/admin"
if errorlevel 1 (
  echo Khong mo duoc trinh duyet. Hay sao chep duong dan o tren.
  pause
  exit /b 1
)
exit /b 0
