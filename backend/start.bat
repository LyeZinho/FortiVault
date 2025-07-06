@echo off
echo 🛡️  Starting FortiVault Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Create necessary directories
if not exist "database" mkdir database
if not exist "backups" mkdir backups

REM Start the server
echo 🚀 Starting FastAPI server...
echo 📊 Database will be created at: database\vault.db
echo 💾 Backups will be stored in: backups\
echo 🌐 API will be available at: http://127.0.0.1:8000
echo 📖 API Documentation: http://127.0.0.1:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py
pause
