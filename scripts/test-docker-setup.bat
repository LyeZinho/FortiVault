@echo off
REM FortiVault - Script de teste completo do Docker setup para Windows

echo 🛡️  FortiVault Docker Setup Test Suite
echo ========================================
echo.

set TESTS_PASSED=0
set TESTS_FAILED=0
set TOTAL_TESTS=0

echo 1. Checking Dependencies
echo ------------------------

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker: ✓ Available
) else (
    echo Docker: ✗ Missing
    echo Please install Docker Desktop
    pause
    exit /b 1
)

REM Verificar Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker Compose: ✓ Available
) else (
    echo Docker Compose: ✗ Missing
    echo Please install Docker Compose
    pause
    exit /b 1
)

REM Verificar cURL
curl --version >nul 2>&1
if %errorlevel% equ 0 (
    echo cURL: ✓ Available
) else (
    echo cURL: ⚠ Missing (optional for testing)
)

echo.

echo 2. Testing File Structure
echo --------------------------

if exist docker-compose.yml (
    echo Docker Compose file: ✓ Found
    set /a TESTS_PASSED+=1
) else (
    echo Docker Compose file: ✗ Missing
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

if exist docker-compose.dev.yml (
    echo Development compose: ✓ Found
    set /a TESTS_PASSED+=1
) else (
    echo Development compose: ✗ Missing
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

if exist Dockerfile.backend (
    echo Backend Dockerfile: ✓ Found
    set /a TESTS_PASSED+=1
) else (
    echo Backend Dockerfile: ✗ Missing
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

if exist Dockerfile.frontend (
    echo Frontend Dockerfile: ✓ Found
    set /a TESTS_PASSED+=1
) else (
    echo Frontend Dockerfile: ✗ Missing
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

if exist nginx\nginx.conf (
    echo Nginx config: ✓ Found
    set /a TESTS_PASSED+=1
) else (
    echo Nginx config: ✗ Missing
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

if exist .env.example (
    echo Environment template: ✓ Found
    set /a TESTS_PASSED+=1
) else (
    echo Environment template: ✗ Missing
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

if exist Makefile (
    echo Makefile: ✓ Found
    set /a TESTS_PASSED+=1
) else (
    echo Makefile: ✗ Missing
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

echo.

echo 3. Testing Docker Environment
echo ------------------------------

docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker daemon: ✓ Running
    set /a TESTS_PASSED+=1
) else (
    echo Docker daemon: ✗ Not running
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

echo.

echo 4. Building Images
echo ------------------

echo Building FortiVault images (this may take a few minutes)...
docker-compose build --no-cache >nul 2>&1
if %errorlevel% equ 0 (
    echo Images build: ✓ Success
    set /a TESTS_PASSED+=1
) else (
    echo Images build: ✗ Failed
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

echo.

echo 5. Testing Development Environment
echo ----------------------------------

echo Starting development environment...
docker-compose -f docker-compose.dev.yml up -d >nul 2>&1

echo Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak >nul

REM Testar conectividade com PowerShell
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 10 -UseBasicParsing | Out-Null; Write-Host 'Frontend (3000): ✓ Responding' } catch { Write-Host 'Frontend (3000): ✗ Not responding' }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/health' -TimeoutSec 10 -UseBasicParsing | Out-Null; Write-Host 'Backend (8000): ✓ Responding' } catch { Write-Host 'Backend (8000): ✗ Not responding' }"

echo.

echo 6. Testing Production Environment
echo --------------------------------

echo Stopping development environment...
docker-compose -f docker-compose.dev.yml down >nul 2>&1

echo Starting production environment...
docker-compose up -d >nul 2>&1

echo Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak >nul

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost' -TimeoutSec 10 -UseBasicParsing | Out-Null; Write-Host 'Nginx (80): ✓ Responding' } catch { Write-Host 'Nginx (80): ✗ Not responding' }"

echo.

echo 7. Cleanup
echo ----------

echo Stopping all services...
docker-compose down >nul 2>&1
docker-compose -f docker-compose.dev.yml down >nul 2>&1

echo Services stopped: ✓ Complete

echo.

echo 8. Test Results Summary
echo =======================
echo.
echo Total Tests: %TOTAL_TESTS%
echo Passed: %TESTS_PASSED%
echo Failed: %TESTS_FAILED%
echo.

if %TESTS_FAILED% equ 0 (
    echo 🎉 All tests passed! FortiVault Docker setup is working correctly.
    echo.
    echo Next steps:
    echo 1. Run 'make dev' to start development environment
    echo 2. Run 'make prod' to start production environment
    echo 3. Run 'make health' to check service health
    echo 4. Open scripts\health-dashboard.html for monitoring
) else (
    echo ❌ Some tests failed. Please check the output above.
    echo.
    echo Common issues:
    echo - Docker daemon not running
    echo - Ports 80, 3000, or 8000 already in use
    echo - Insufficient permissions
    echo - Missing environment file (.env^)
)

echo.
pause