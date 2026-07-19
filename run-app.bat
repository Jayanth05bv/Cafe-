@echo off
title Digital Cafe - Launcher

if exist "C:\Users\Nikhil Sinha\Downloads\integrate (2)\integrate\digital-cafe-fullstack\digital-cafe-backend\.env.bat" (
    call "C:\Users\Nikhil Sinha\Downloads\integrate (2)\integrate\digital-cafe-fullstack\digital-cafe-backend\.env.bat"
)

echo Starting Backend...
start "Backend" cmd /k "cd /d ""C:\Users\Nikhil Sinha\Downloads\integrate (2)\integrate\digital-cafe-fullstack\digital-cafe-backend"" && mvnw.cmd spring-boot:run"

echo Starting Frontend...
start "Frontend" cmd /k "cd /d ""C:\Users\Nikhil Sinha\Downloads\integrate (2)\integrate\digital-cafe-fullstack\digital-cafe-frontend"" && npm start"

echo Waiting for backend to start...
timeout /t 20 /nobreak >nul

echo Opening H2 connection help (use the JDBC URL shown there in H2 Console)...
start msedge http://localhost:8081/h2-console-help.html

echo Done. Backend and Frontend are running in separate windows.
pause
