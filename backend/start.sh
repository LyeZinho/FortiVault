#!/bin/bash

# FortiVault Backend Startup Script

echo "🛡️  Starting FortiVault Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Setup database if it doesn't exist
if [ ! -f "$HOME/.fortivault/vault.db" ]; then
    echo "🗄️  Setting up database..."
    python scripts/setup_database.py
fi

# Test encryption
echo "🔐 Testing encryption..."
python scripts/test_encryption.py

# Start the server
echo "🚀 Starting FortiVault API server..."
python main.py
