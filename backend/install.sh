#!/bin/bash

echo "🛡️  FortiVault Backend Installation Script"
echo "=========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8 or higher and try again."
    exit 1
fi

echo "✅ Python 3 found"

# Check Python version
python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "📋 Python version: $python_version"

# Upgrade pip
echo "📦 Upgrading pip..."
python3 -m pip install --upgrade pip

# Install packages one by one with error handling
echo "📥 Installing required packages..."

packages=(
    "fastapi"
    "uvicorn[standard]"
    "aiosqlite"
    "cryptography"
    "argon2-cffi"
    "PyJWT"
    "python-multipart"
    "pydantic"
    "pydantic-settings"
    "passlib[bcrypt]"
)

failed_packages=()

for package in "${packages[@]}"; do
    echo "   Installing $package..."
    if python3 -m pip install "$package" > /dev/null 2>&1; then
        echo "   ✅ $package installed successfully"
    else
        echo "   ⚠️  Failed to install $package, trying without extras..."
        base_package=$(echo "$package" | cut -d'[' -f1)
        if python3 -m pip install "$base_package" > /dev/null 2>&1; then
            echo "   ✅ $base_package installed successfully"
        else
            echo "   ❌ Failed to install $base_package"
            failed_packages+=("$package")
        fi
    fi
done

if [ ${#failed_packages[@]} -eq 0 ]; then
    echo "✅ All packages installed successfully"
else
    echo "⚠️  Some packages failed to install: ${failed_packages[*]}"
    echo "You can try installing them manually or use the simple version"
fi

# Run setup
echo "🔧 Running setup..."
if python3 setup.py; then
    echo "✅ Setup completed successfully"
else
    echo "⚠️  Setup had issues, trying simple version..."
    python3 simple_main.py
fi

echo ""
echo "🎉 Installation completed!"
echo ""
echo "To start FortiVault:"
echo "  python3 main.py          # Full version"
echo "  python3 simple_main.py   # Simple version"
