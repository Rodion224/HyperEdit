@echo off
title Launching HyperEdit...
cd /d "%~dp0"
start "" ".\node_modules\electron\dist\electron.exe" .
exit
