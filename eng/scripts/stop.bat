@echo off
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
