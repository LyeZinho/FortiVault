#!/usr/bin/env python3
"""
FortiVault Setup Script
Handles installation and initial configuration
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3.8):
        print("❌ Python 3.8 or higher is required")
        print(f"   Current version: {sys.version}")
        return False
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    
    requirements = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0", 
        "aiosqlite==0.19.0",
        "cryptography==41.0.7",
        "argon2-cffi==23.1.0",
        "PyJWT==2.8.0",
        "python-multipart==0.0.6",
        "pydantic==2.5.0",
        "pydantic-settings==2.1.0",
        "passlib[bcrypt]==1.7.4"
    ]
    
    for package in requirements:
        try:
            print(f"   Installing {package.split('==')[0]}...")
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", package
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except subprocess.CalledProcessError as e:
            print(f"   ⚠️  Failed to install {package}: {e}")
            # Try without version constraint
            package_name = package.split('==')[0]
            try:
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install", package_name
                ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"   ✅ Installed {package_name} (latest version)")
            except:
                print(f"   ❌ Could not install {package_name}")
                return False
    
    print("✅ All packages installed successfully")
    return True

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    
    home_dir = Path.home()
    fortivault_dir = home_dir / ".fortivault"
    backup_dir = fortivault_dir / "backups"
    
    try:
        fortivault_dir.mkdir(exist_ok=True)
        backup_dir.mkdir(exist_ok=True)
        
        print(f"   ✅ Created: {fortivault_dir}")
        print(f"   ✅ Created: {backup_dir}")
        return True
    except Exception as e:
        print(f"   ❌ Error creating directories: {e}")
        return False

def setup_database():
    """Setup the database"""
    print("🗄️  Setting up database...")
    
    try:
        # Import here to avoid import errors before packages are installed
        import asyncio
        import sqlite3
        from pathlib import Path
        
        # Create database file
        home_dir = Path.home()
        db_path = home_dir / ".fortivault" / "vault.db"
        
        # Create database and tables
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create tables
        tables = [
            """
            CREATE TABLE IF NOT EXISTS passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                username TEXT,
                password TEXT NOT NULL,
                url TEXT,
                notes TEXT,
                folder_id TEXT,
                strength INTEGER DEFAULT 0,
                is_favorite BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                backup_type TEXT DEFAULT 'manual',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                size_bytes INTEGER DEFAULT 0
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS auth_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_token TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
            """
        ]
        
        for table_sql in tables:
            cursor.execute(table_sql)
        
        # Insert default folders
        default_folders = [
            ('personal', 'Personal'),
            ('work', 'Work'),
            ('social', 'Social Media'),
            ('finance', 'Finance')
        ]
        
        for folder_id, folder_name in default_folders:
            cursor.execute(
                "INSERT OR IGNORE INTO folders (id, name) VALUES (?, ?)",
                (folder_id, folder_name)
            )
        
        # Insert default settings
        default_settings = [
            ('auto_lock_timeout', '15'),
            ('auto_backup_enabled', 'true'),
            ('clipboard_timeout', '30'),
            ('theme', 'dark'),
            ('backup_retention_days', '30')
        ]
        
        for key, value in default_settings:
            cursor.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
                (key, value)
            )
        
        conn.commit()
        conn.close()
        
        print(f"   ✅ Database created: {db_path}")
        return True
        
    except Exception as e:
        print(f"   ❌ Database setup failed: {e}")
        return False

def test_installation():
    """Test if everything is working"""
    print("🧪 Testing installation...")
    
    try:
        # Test imports
        import fastapi
        import uvicorn
        import aiosqlite
        import cryptography
        import argon2
        import jwt
        
        print("   ✅ All imports successful")
        
        # Test database connection
        import sqlite3
        from pathlib import Path
        
        db_path = Path.home() / ".fortivault" / "vault.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM folders")
        folder_count = cursor.fetchone()[0]
        conn.close()
        
        print(f"   ✅ Database connection successful ({folder_count} folders)")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🛡️  FortiVault Backend Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install requirements
    if not install_requirements():
        print("❌ Failed to install requirements")
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        print("❌ Failed to create directories")
        sys.exit(1)
    
    # Setup database
    if not setup_database():
        print("❌ Failed to setup database")
        sys.exit(1)
    
    # Test installation
    if not test_installation():
        print("❌ Installation test failed")
        sys.exit(1)
    
    print("\n🎉 FortiVault setup completed successfully!")
    print("\nNext steps:")
    print("1. Run: python main.py")
    print("2. Open your browser to: http://localhost:8000")
    print("3. Setup your master password")
    print("4. Start using FortiVault!")
    
    # Ask if user wants to start the server
    try:
        start_server = input("\nWould you like to start the server now? (y/n): ").lower().strip()
        if start_server in ['y', 'yes']:
            print("\n🚀 Starting FortiVault server...")
            os.system(f"{sys.executable} main.py")
    except KeyboardInterrupt:
        print("\n👋 Setup completed. Run 'python main.py' to start the server.")

if __name__ == "__main__":
    main()
