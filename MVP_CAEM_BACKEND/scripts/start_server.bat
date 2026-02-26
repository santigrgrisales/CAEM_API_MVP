@echo off
cd /d %~dp0
cd ..
echo Starting CAEM Backend API...
node src/index.js
pause