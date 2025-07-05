"""
Password vault management service
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime

from database.models import db_manager
from core.security import security_manager

class VaultService:
    """Handles password vault operations"""
    
    def __init__(self):
        self.db = db_manager
    
    async def get_all_passwords(self) -> List[Dict[str, Any]]:
        """Get all passwords from vault"""
        encrypted_passwords = await self.db.execute_query(
            """
            SELECT id, title, username, password, url, notes, folder_id, 
                   strength, is_favorite, created_at, updated_at
            FROM passwords 
            ORDER BY updated_at DESC
            """
        )
        
        # Decrypt passwords
        decrypted_passwords = []
        master_key = security_manager.get_master_key()
        
        if not master_key:
            raise ValueError("Master key not set")
        
        for pwd in encrypted_passwords:
            try:
                # Decrypt password data
                encrypted_data = json.loads(pwd['password'])
                decrypted_password = security_manager.decrypt_data(encrypted_data, master_key)
                
                pwd_copy = dict(pwd)
                pwd_copy['password'] = decrypted_password
                decrypted_passwords.append(pwd_copy)
            except Exception as e:
                print(f"Error decrypting password {pwd['id']}: {e}")
                continue
        
        return decrypted_passwords
    
    async def get_password_by_id(self, password_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific password by ID"""
        passwords = await self.db.execute_query(
            """
            SELECT id, title, username, password, url, notes, folder_id,
                   strength, is_favorite, created_at, updated_at
            FROM passwords 
            WHERE id = ?
            """,
            (password_id,)
        )
        
        if not passwords:
            return None
        
        pwd = passwords[0]
        master_key = security_manager.get_master_key()
        
        if not master_key:
            raise ValueError("Master key not set")
        
        try:
            encrypted_data = json.loads(pwd['password'])
            decrypted_password = security_manager.decrypt_data(encrypted_data, master_key)
            
            pwd_copy = dict(pwd)
            pwd_copy['password'] = decrypted_password
            return pwd_copy
        except Exception as e:
            print(f"Error decrypting password {password_id}: {e}")
            return None
    
    async def add_password(self, password_data: Dict[str, Any]) -> int:
        """Add a new password to vault"""
        master_key = security_manager.get_master_key()
        
        if not master_key:
            raise ValueError("Master key not set")
        
        # Encrypt password
        encrypted_password = security_manager.encrypt_data(
            password_data['password'], 
            master_key
        )
        
        # Calculate password strength
        strength = self._calculate_password_strength(password_data['password'])
        
        # Insert into database
        password_id = await self.db.execute_update(
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
                strength,
                password_data.get('is_favorite', False)
            )
        )
        
        return password_id
    
    async def update_password(self, password_id: int, password_data: Dict[str, Any]) -> bool:
        """Update an existing password"""
        master_key = security_manager.get_master_key()
        
        if not master_key:
            raise ValueError("Master key not set")
        
        # Encrypt password if provided
        encrypted_password = None
        strength = None
        
        if 'password' in password_data:
            encrypted_password = security_manager.encrypt_data(
                password_data['password'], 
                master_key
            )
            strength = self._calculate_password_strength(password_data['password'])
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if 'title' in password_data:
            update_fields.append("title = ?")
            params.append(password_data['title'])
        
        if 'username' in password_data:
            update_fields.append("username = ?")
            params.append(password_data['username'])
        
        if encrypted_password:
            update_fields.append("password = ?")
            params.append(json.dumps(encrypted_password))
        
        if 'url' in password_data:
            update_fields.append("url = ?")
            params.append(password_data['url'])
        
        if 'notes' in password_data:
            update_fields.append("notes = ?")
            params.append(password_data['notes'])
        
        if 'folder_id' in password_data:
            update_fields.append("folder_id = ?")
            params.append(password_data['folder_id'])
        
        if strength is not None:
            update_fields.append("strength = ?")
            params.append(strength)
        
        if 'is_favorite' in password_data:
            update_fields.append("is_favorite = ?")
            params.append(password_data['is_favorite'])
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(password_id)
        
        query = f"UPDATE passwords SET {', '.join(update_fields)} WHERE id = ?"
        
        rows_affected = await self.db.execute_update(query, tuple(params))
        return rows_affected > 0
    
    async def delete_password(self, password_id: int) -> bool:
        """Delete a password from vault"""
        rows_affected = await self.db.execute_update(
            "DELETE FROM passwords WHERE id = ?",
            (password_id,)
        )
        return rows_affected > 0
    
    async def get_folders(self) -> List[Dict[str, Any]]:
        """Get all folders"""
        folders = await self.db.execute_query(
            "SELECT id, name, icon, created_at FROM folders ORDER BY name"
        )
        
        # Add password count for each folder
        for folder in folders:
            count_result = await self.db.execute_query(
                "SELECT COUNT(*) as count FROM passwords WHERE folder_id = ?",
                (folder['id'],)
            )
            folder['count'] = count_result[0]['count'] if count_result else 0
        
        return folders
    
    async def add_folder(self, folder_data: Dict[str, Any]) -> str:
        """Add a new folder"""
        await self.db.execute_update(
            "INSERT INTO folders (id, name, icon) VALUES (?, ?, ?)",
            (
                folder_data['id'],
                folder_data['name'],
                folder_data.get('icon', '')
            )
        )
        return folder_data['id']
    
    async def search_passwords(self, query: str) -> List[Dict[str, Any]]:
        """Search passwords by title, username, or URL"""
        search_query = f"%{query}%"
        encrypted_passwords = await self.db.execute_query(
            """
            SELECT id, title, username, password, url, notes, folder_id,
                   strength, is_favorite, created_at, updated_at
            FROM passwords 
            WHERE title LIKE ? OR username LIKE ? OR url LIKE ?
            ORDER BY updated_at DESC
            """,
            (search_query, search_query, search_query)
        )
        
        # Decrypt passwords
        decrypted_passwords = []
        master_key = security_manager.get_master_key()
        
        if not master_key:
            raise ValueError("Master key not set")
        
        for pwd in encrypted_passwords:
            try:
                encrypted_data = json.loads(pwd['password'])
                decrypted_password = security_manager.decrypt_data(encrypted_data, master_key)
                
                pwd_copy = dict(pwd)
                pwd_copy['password'] = decrypted_password
                decrypted_passwords.append(pwd_copy)
            except Exception as e:
                print(f"Error decrypting password {pwd['id']}: {e}")
                continue
        
        return decrypted_passwords
    
    def _calculate_password_strength(self, password: str) -> int:
        """Calculate password strength score (0-100)"""
        if not password:
            return 0
        
        score = 0
        
        # Length scoring
        if len(password) >= 8:
            score += 25
        if len(password) >= 12:
            score += 25
        
        # Character variety scoring
        if any(c.islower() for c in password):
            score += 10
        if any(c.isupper() for c in password):
            score += 10
        if any(c.isdigit() for c in password):
            score += 10
        if any(not c.isalnum() for c in password):
            score += 20
        
        return min(score, 100)
    
    async def get_vault_stats(self) -> Dict[str, Any]:
        """Get vault statistics"""
        total_passwords = await self.db.execute_query(
            "SELECT COUNT(*) as count FROM passwords"
        )
        
        weak_passwords = await self.db.execute_query(
            "SELECT COUNT(*) as count FROM passwords WHERE strength < 60"
        )
        
        favorite_passwords = await self.db.execute_query(
            "SELECT COUNT(*) as count FROM passwords WHERE is_favorite = TRUE"
        )
        
        recent_passwords = await self.db.execute_query(
            """
            SELECT COUNT(*) as count FROM passwords 
            WHERE created_at >= datetime('now', '-7 days')
            """
        )
        
        return {
            'total_passwords': total_passwords[0]['count'] if total_passwords else 0,
            'weak_passwords': weak_passwords[0]['count'] if weak_passwords else 0,
            'favorite_passwords': favorite_passwords[0]['count'] if favorite_passwords else 0,
            'recent_passwords': recent_passwords[0]['count'] if recent_passwords else 0
        }

# Global vault service instance
vault_service = VaultService()
