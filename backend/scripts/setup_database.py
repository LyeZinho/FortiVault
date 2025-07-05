#!/usr/bin/env python3
"""
Database setup script for FortiVault
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from database.models import init_database
from core.config import settings

async def setup_database():
    """Setup the database with initial data"""
    print("Setting up FortiVault database...")
    
    try:
        # Initialize database
        await init_database()
        print(f"✅ Database initialized at: {settings.DATA_DIR / settings.VAULT_FILE}")
        
        # Create data directories
        settings.DATA_DIR.mkdir(exist_ok=True)
        (settings.DATA_DIR / settings.BACKUP_DIR).mkdir(exist_ok=True)
        
        print(f"✅ Data directory created at: {settings.DATA_DIR}")
        print(f"✅ Backup directory created at: {settings.DATA_DIR / settings.BACKUP_DIR}")
        
        print("\n🎉 FortiVault database setup completed successfully!")
        print("\nNext steps:")
        print("1. Run the backend server: python main.py")
        print("2. Setup your master password via the API or frontend")
        print("3. Start adding your passwords securely!")
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(setup_database())
