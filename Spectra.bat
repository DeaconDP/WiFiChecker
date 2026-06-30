@echo off
cd /d "%~dp0"
python launch.py
if errorlevel 1 (
  echo.
  echo Spectra could not start. Make sure Python 3 is installed from https://python.org
  pause
)
