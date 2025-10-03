@echo off
setlocal enabledelayedexpansion

echo 🛡️  FortiVault Docker Setup
echo =========================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if docker-compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose is not installed. Please install docker-compose first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env >nul
    
    REM Generate a simple secret key (Windows doesn't have openssl by default)
    set SECRET_KEY=fortivault-secret-key-!RANDOM!!RANDOM!!RANDOM!
    powershell -Command "(Get-Content .env) -replace 'your-super-secret-key-min-32-characters-long-change-this', '%SECRET_KEY%' | Set-Content .env"
    
    echo ✅ .env file created with generated secret key
    echo 📝 Please review and modify .env file if needed
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist nginx\logs mkdir nginx\logs
if not exist nginx\ssl mkdir nginx\ssl

REM Determine which compose file to use
set COMPOSE_FILE=docker-compose.yml
if "%1"=="dev" set COMPOSE_FILE=docker-compose.dev.yml
if "%1"=="development" set COMPOSE_FILE=docker-compose.dev.yml

if "%COMPOSE_FILE%"=="docker-compose.dev.yml" (
    echo 🔧 Starting in development mode...
) else (
    echo 🚀 Starting in production mode...
)

REM Build and start services
echo 🏗️  Building and starting services...
docker-compose -f %COMPOSE_FILE% up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service status
echo 📊 Service Status:
docker-compose -f %COMPOSE_FILE% ps

REM Display access information
echo.
echo ✅ FortiVault is starting up!
echo 🌐 Frontend: http://localhost:3000
echo 🔌 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs

if "%COMPOSE_FILE%"=="docker-compose.dev.yml" (
    echo 🗄️  Database Viewer: http://localhost:8080
)

echo.
echo 📝 Useful commands:
echo    View logs: docker-compose -f %COMPOSE_FILE% logs -f
echo    Stop: docker-compose -f %COMPOSE_FILE% down
echo    Restart: docker-compose -f %COMPOSE_FILE% restart
echo    Update: docker-compose -f %COMPOSE_FILE% pull ^&^& docker-compose -f %COMPOSE_FILE% up -d

echo.
echo 🛡️  FortiVault is ready! Enjoy secure password management!

pause