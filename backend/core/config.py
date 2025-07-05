"""
Configuration settings for FortiVault
"""

import os
from pathlib import Path
from typing import Optional

class Settings:
    """Application settings"""
    
    # Application
    APP_NAME: str = "FortiVault"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Server
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fortivault-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fortivault.db")
    
    # Encryption
    ENCRYPTION_ALGORITHM: str = "AES-256-GCM"
    KEY_DERIVATION_ALGORITHM: str = "Argon2"
    
    # Paths
    DATA_DIR: Path = Path.home() / ".fortivault"
    VAULT_FILE: str = "vault.db"
    KEYS_FILE: str = "keys.enc"
    BACKUP_DIR: str = "backups"
    
    # Backup
    AUTO_BACKUP_ENABLED: bool = True
    BACKUP_RETENTION_DAYS: int = 30

# Create settings instance
settings = Settings()

# Ensure data directory exists
try:
    settings.DATA_DIR.mkdir(exist_ok=True)
    (settings.DATA_DIR / settings.BACKUP_DIR).mkdir(exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create data directories: {e}")
