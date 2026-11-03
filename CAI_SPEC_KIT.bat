@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-spec-kit.ps1" -ToolsOnly -InstallSharedCommand
if errorlevel 1 (
  echo Spec Kit setup failed. See the error above.
  pause
  exit /b 1
)
echo Spec Kit is ready. Reopen your terminal to use speckit-project.
pause
