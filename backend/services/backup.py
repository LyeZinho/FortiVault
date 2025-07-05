"""
Backup and restore service for FortiVault
"""

import json
import zipfile
import shutil
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

from database.models import db_manager
from core.security import security_manager
from core.config import settings
from services.vault import vault_service

class BackupService:
    """Handles backup and restore operations"""
    
    def __init__(self):
        self.db = db_manager
        self.backup_dir = settings.DATA_DIR / settings.BACKUP_DIR
        self.backup_dir.mkdir(exist_ok=True)
    
    async def create_backup(self, backup_type: str = "manual") -> Dict[str, Any]:
        """Create a full vault backup"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"fortivault_backup_{timestamp}.fvault"
        backup_path = self.backup_dir / backup_filename
        
        try:
            # Get all vault data
            passwords = await vault_service.get_all_passwords()
            folders = await vault_service.get_folders()
            settings_data = await self._get_settings()
            
            # Create backup data structure
            backup_data = {
                "version": "1.0",
                "created_at": datetime.utcnow().isoformat(),
                "backup_type": backup_type,
                "data": {
                    "passwords": passwords,
                    "folders": folders,
                    "settings": settings_data
                },
                "metadata": {
                    "total_passwords": len(passwords),
                    "total_folders": len(folders),
                    "app_version": settings.VERSION
                }
            }
            
            # Generate backup key
            backup_key = security_manager.generate_backup_key()
            
            # Encrypt backup data
            encrypted_backup = security_manager.encrypt_for_backup(
                json.dumps(backup_data, indent=2),
                backup_key
            )
            
            # Create backup file structure
            backup_file_data = {
                "fortivault_backup": True,
                "version": "1.0",
                "encrypted_data": encrypted_backup,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Write backup file
            with open(backup_path, 'w') as f:
                json.dump(backup_file_data, f, indent=2)
            
            # Record backup in database
            backup_id = await self.db.execute_update(
                """
                INSERT INTO backups (filename, file_path, backup_type, size_bytes)
                VALUES (?, ?, ?, ?)
                """,
                (
                    backup_filename,
                    str(backup_path),
                    backup_type,
                    backup_path.stat().st_size
                )
            )
            
            return {
                "backup_id": backup_id,
                "filename": backup_filename,
                "backup_key": backup_key,
                "file_path": str(backup_path),
                "size_bytes": backup_path.stat().st_size,
                "created_at": datetime.utcnow().isoformat(),
                "total_passwords": len(passwords)
            }
            
        except Exception as e:
            # Clean up failed backup file
            if backup_path.exists():
                backup_path.unlink()
            raise Exception(f"Backup creation failed: {str(e)}")
    
    async def restore_backup(self, backup_file_path: str, backup_key: str, merge: bool = False) -> Dict[str, Any]:
        """Restore vault from backup file"""
        try:
            backup_path = Path(backup_file_path)
            
            if not backup_path.exists():
                raise FileNotFoundError("Backup file not found")
            
            # Read backup file
            with open(backup_path, 'r') as f:
                backup_file_data = json.load(f)
            
            # Verify backup file format
            if not backup_file_data.get("fortivault_backup"):
                raise ValueError("Invalid backup file format")
            
            # Decrypt backup data
            encrypted_data = backup_file_data["encrypted_data"]
            decrypted_data = security_manager.decrypt_from_backup(encrypted_data, backup_key)
            backup_data = json.loads(decrypted_data)
            
            # Validate backup data structure
            if "data" not in backup_data:
                raise ValueError("Invalid backup data structure")
            
            data = backup_data["data"]
            
            # Clear existing data if not merging
            if not merge:
                await self._clear_vault_data()
            
            # Restore folders
            if "folders" in data:
                for folder in data["folders"]:
                    await self._restore_folder(folder, merge)
            
            # Restore passwords
            restored_passwords = 0
            if "passwords" in data:
                for password in data["passwords"]:
                    success = await self._restore_password(password, merge)
                    if success:
                        restored_passwords += 1
            
            # Restore settings
            if "settings" in data and not merge:
                for setting in data["settings"]:
                    await self._restore_setting(setting)
            
            return {
                "success": True,
                "restored_passwords": restored_passwords,
                "restored_folders": len(data.get("folders", [])),
                "backup_date": backup_data.get("created_at"),
                "merge_mode": merge
            }
            
        except Exception as e:
            raise Exception(f"Backup restore failed: {str(e)}")
    
    async def get_backup_history(self) -> List[Dict[str, Any]]:
        """Get list of all backups"""
        backups = await self.db.execute_query(
            """
            SELECT id, filename, file_path, backup_type, created_at, size_bytes
            FROM backups 
            ORDER BY created_at DESC
            """
        )
        
        # Check if backup files still exist
        for backup in backups:
            backup_path = Path(backup['file_path'])
            backup['file_exists'] = backup_path.exists()
            backup['size_mb'] = round(backup['size_bytes'] / (1024 * 1024), 2)
        
        return backups
    
    async def delete_backup(self, backup_id: int) -> bool:
        """Delete a backup file and record"""
        backup_info = await self.db.execute_query(
            "SELECT file_path FROM backups WHERE id = ?",
            (backup_id,)
        )
        
        if not backup_info:
            return False
        
        # Delete file if it exists
        backup_path = Path(backup_info[0]['file_path'])
        if backup_path.exists():
            backup_path.unlink()
        
        # Delete database record
        rows_affected = await self.db.execute_update(
            "DELETE FROM backups WHERE id = ?",
            (backup_id,)
        )
        
        return rows_affected > 0
    
    async def verify_backup(self, backup_file_path: str, backup_key: str) -> Dict[str, Any]:
        """Verify backup file integrity"""
        try:
            backup_path = Path(backup_file_path)
            
            if not backup_path.exists():
                return {"valid": False, "error": "Backup file not found"}
            
            # Read and decrypt backup
            with open(backup_path, 'r') as f:
                backup_file_data = json.load(f)
            
            if not backup_file_data.get("fortivault_backup"):
                return {"valid": False, "error": "Invalid backup file format"}
            
            encrypted_data = backup_file_data["encrypted_data"]
            decrypted_data = security_manager.decrypt_from_backup(encrypted_data, backup_key)
            backup_data = json.loads(decrypted_data)
            
            # Verify data structure
            required_fields = ["version", "created_at", "data"]
            for field in required_fields:
                if field not in backup_data:
                    return {"valid": False, "error": f"Missing required field: {field}"}
            
            metadata = backup_data.get("metadata", {})
            
            return {
                "valid": True,
                "version": backup_data["version"],
                "created_at": backup_data["created_at"],
                "total_passwords": metadata.get("total_passwords", 0),
                "total_folders": metadata.get("total_folders", 0),
                "app_version": metadata.get("app_version", "unknown"),
                "file_size_mb": round(backup_path.stat().st_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def _get_settings(self) -> List[Dict[str, Any]]:
        """Get all settings for backup"""
        return await self.db.execute_query(
            "SELECT key, value, updated_at FROM settings"
        )
    
    async def _clear_vault_data(self):
        """Clear all vault data (for full restore)"""
        await self.db.execute_update("DELETE FROM passwords")
        await self.db.execute_update("DELETE FROM folders WHERE id NOT IN ('personal', 'work', 'social', 'finance')")
    
    async def _restore_folder(self, folder_data: Dict[str, Any], merge: bool) -> bool:
        """Restore a single folder"""
        try:
            if merge:
                # Check if folder exists
                existing = await self.db.execute_query(
                    "SELECT id FROM folders WHERE id = ?",
                    (folder_data['id'],)
                )
                if existing:
                    return True  # Skip existing folder in merge mode
            
            await self.db.execute_update(
                "INSERT OR REPLACE INTO folders (id, name, icon) VALUES (?, ?, ?)",
                (
                    folder_data['id'],
                    folder_data['name'],
                    folder_data.get('icon', '')
                )
            )
            return True
        except Exception as e:
            print(f"Error restoring folder {folder_data.get('id')}: {e}")
            return False
    
    async def _restore_password(self, password_data: Dict[str, Any], merge: bool) -> bool:
        """Restore a single password"""
        try:
            master_key = security_manager.get_master_key()
            if not master_key:
                raise ValueError("Master key not set")
            
            # Encrypt password for storage
            encrypted_password = security_manager.encrypt_data(
                password_data['password'],
                master_key
            )
            
            if merge:
                # In merge mode, add as new password
                await self.db.execute_update(
                    """
                    INSERT INTO passwords (title, username, password, url, notes, folder_id, strength, is_favorite)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        password_data['title'],
                        password_data.get('username', ''),
                        json.dumps(encrypted_password),
                        password_data.get('url', ''),
                        password_data.get('notes', ''),
                        password_data.get('folder_id', ''),
                        password_data.get('strength', 0),
                        password_data.get('is_favorite', False)
                    )
                )
            else:
                # Full restore mode
                await self.db.execute_update(
                    """
                    INSERT INTO passwords (id, title, username, password, url, notes, folder_id, strength, is_favorite, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        password_data.get('id'),
                        password_data['title'],
                        password_data.get('username', ''),
                        json.dumps(encrypted_password),
                        password_data.get('url', ''),
                        password_data.get('notes', ''),
                        password_data.get('folder_id', ''),
                        password_data.get('strength', 0),
                        password_data.get('is_favorite', False),
                        password_data.get('created_at'),
                        password_data.get('updated_at')
                    )
                )
            
            return True
        except Exception as e:
            print(f"Error restoring password {password_data.get('title')}: {e}")
            return False
    
    async def _restore_setting(self, setting_data: Dict[str, Any]) -> bool:
        """Restore a single setting"""
        try:
            await self.db.execute_update(
                "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
                (
                    setting_data['key'],
                    setting_data['value'],
                    setting_data.get('updated_at', datetime.utcnow().isoformat())
                )
            )
            return True
        except Exception as e:
            print(f"Error restoring setting {setting_data.get('key')}: {e}")
            return False

# Global backup service instance
backup_service = BackupService()
