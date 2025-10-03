@echo off
REM FortiVault - Script de monitoramento de health check para Windows

echo 🔍 FortiVault Health Check Monitor
echo ==================================
echo.

REM URLs dos serviços
set FRONTEND_URL=http://localhost:3000
set BACKEND_URL=http://localhost:8000
set NGINX_URL=http://localhost:80

echo 1. Testing Basic Connectivity
echo -----------------------------

REM Testar conectividade usando PowerShell
powershell -Command "try { (Invoke-WebRequest -Uri %FRONTEND_URL% -TimeoutSec 5 -UseBasicParsing).StatusCode; Write-Host 'Frontend (Port 3000): ✓ Connected' -ForegroundColor Green } catch { Write-Host 'Frontend (Port 3000): ✗ Connection failed' -ForegroundColor Red }"

powershell -Command "try { (Invoke-WebRequest -Uri %BACKEND_URL% -TimeoutSec 5 -UseBasicParsing).StatusCode; Write-Host 'Backend (Port 8000): ✓ Connected' -ForegroundColor Green } catch { Write-Host 'Backend (Port 8000): ✗ Connection failed' -ForegroundColor Red }"

powershell -Command "try { (Invoke-WebRequest -Uri %NGINX_URL% -TimeoutSec 5 -UseBasicParsing).StatusCode; Write-Host 'Nginx (Port 80): ✓ Connected' -ForegroundColor Green } catch { Write-Host 'Nginx (Port 80): ✗ Connection failed' -ForegroundColor Red }"

echo.
echo 2. Testing Health Endpoints
echo ----------------------------

REM Testar health endpoints
curl -s %FRONTEND_URL%/api/health > nul 2>&1 && (
    echo Frontend Health: ✓ OK
    curl -s %FRONTEND_URL%/api/health | findstr "status"
) || echo Frontend Health: ✗ FAILED

curl -s %BACKEND_URL%/health > nul 2>&1 && (
    echo Backend Health: ✓ OK
    curl -s %BACKEND_URL%/health | findstr "status"
) || echo Backend Health: ✗ FAILED

curl -s %NGINX_URL%/api/health > nul 2>&1 && (
    echo Nginx Proxy Health: ✓ OK
    curl -s %NGINX_URL%/api/health | findstr "status"
) || echo Nginx Proxy Health: ✗ FAILED

echo.
echo 3. Testing Key Backend Endpoints
echo --------------------------------

curl -s %BACKEND_URL%/docs > nul 2>&1 && echo Backend Docs: ✓ OK || echo Backend Docs: ✗ FAILED
curl -s %BACKEND_URL%/openapi.json > nul 2>&1 && echo Backend OpenAPI: ✓ OK || echo Backend OpenAPI: ✗ FAILED

echo.
echo 4. Docker Container Status
echo ---------------------------

docker ps --filter name=fortivault --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul || echo No FortiVault containers running

echo.
echo Monitoring complete!
echo.
echo For continuous monitoring, run:
echo   scripts\monitor-health.bat
echo.
echo For Docker logs:
echo   docker-compose logs -f

pause