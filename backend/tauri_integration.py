"""
Tauri integration commands for FortiVault
This file provides the bridge between the Tauri frontend and Python backend
"""

import asyncio
import json
from typing import Dict, Any, List, Optional

# Import all services
from services.vault import vault_service
from services.backup import backup_service
from core.security import security_manager
from database.models import db_manager

class TauriCommands:
    """Tauri command handlers for FortiVault"""
    
    @staticmethod
    async def setup_vault(master_password: str) -> Dict[str, Any]:
        """Setup vault with master password"""
        try:
            # Hash and store master password
            hashed_password = security_manager.hash_master_password(master_password)
            
            await db_manager.execute_update(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                ("master_password_hash", hashed_password)
            )
            
            # Set master key
            success = security_manager.set_master_key(master_password)
            if not success:
                return {"success": False, "error": "Failed to setup vault"}
            
            return {"success": True, "message": "Vault setup successfully"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def authenticate(master_password: str) -> Dict[str, Any]:
        """Authenticate with master password"""
        try:
            # Get stored password hash
            stored_hash = await db_manager.execute_query(
                "SELECT value FROM settings WHERE key = 'master_password_hash'"
            )
            
            if not stored_hash:
                return {"success": False, "error": "Vault not setup"}
            
            # Verify master password
            is_valid = security_manager.verify_master_password(
                master_password,
                stored_hash[0]['value']
            )
            
            if not is_valid:
                return {"success": False, "error": "Invalid master password"}
            
            # Set master key
            success = security_manager.set_master_key(master_password)
            if not success:
                return {"success": False, "error": "Authentication failed"}
            
            return {"success": True, "message": "Authentication successful"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_all_passwords() -> Dict[str, Any]:
        """Get all passwords"""
        try:
            passwords = await vault_service.get_all_passwords()
            return {"success": True, "passwords": passwords}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def add_password(password_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new password"""
        try:
            password_id = await vault_service.add_password(password_data)
            return {"success": True, "id": password_id}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def update_password(password_id: int, password_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a password"""
        try:
            success = await vault_service.update_password(password_id, password_data)
            return {"success": success}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def delete_password(password_id: int) -> Dict[str, Any]:
        """Delete a password"""
        try:
            success = await vault_service.delete_password(password_id)
            return {"success": success}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_folders() -> Dict[str, Any]:
        """Get all folders"""
        try:
            folders = await vault_service.get_folders()
            return {"success": True, "folders": folders}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def create_backup() -> Dict[str, Any]:
        """Create a backup"""
        try:
            backup_info = await backup_service.create_backup("manual")
            return {"success": True, "backup": backup_info}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_backup_history() -> Dict[str, Any]:
        """Get backup history"""
        try:
            backups = await backup_service.get_backup_history()
            return {"success": True, "backups": backups}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_vault_stats() -> Dict[str, Any]:
        """Get vault statistics"""
        try:
            stats = await vault_service.get_vault_stats()
            return {"success": True, "stats": stats}
        except Exception as e:
            return {"success": False, "error": str(e)}

# Export command handlers for Tauri
tauri_commands = TauriCommands()
