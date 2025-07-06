"""
Enhanced database manager with full schema
"""

import sqlite3
import json
import secrets
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_database()
    
    def init_database(self):
        """Initialize database with complete schema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                -- Users and Authentication
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT,
                    password_hash TEXT NOT NULL,
                    is_2fa_enabled BOOLEAN DEFAULT FALSE,
                    totp_secret TEXT,
                    backup_codes TEXT, -- JSON array
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- Master password for vault encryption
                CREATE TABLE IF NOT EXISTS master_auth (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt BLOB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
                
                -- Folders for organizing passwords
                CREATE TABLE IF NOT EXISTS folders (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    color TEXT NOT NULL,
                    icon TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
                
                -- Password entries
                CREATE TABLE IF NOT EXISTS passwords (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    username TEXT NOT NULL,
                    password_encrypted TEXT NOT NULL,
                    url TEXT,
                    notes_encrypted TEXT,
                    folder_id TEXT DEFAULT 'default',
                    tags TEXT DEFAULT '[]', -- JSON array
                    strength TEXT NOT NULL,
                    is_favorite BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (folder_id) REFERENCES folders (id)
                );
                
                -- Application settings
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    UNIQUE(user_id, key)
                );
                
                -- Backup history
                CREATE TABLE IF NOT EXISTS backups (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    size_bytes INTEGER,
                    backup_type TEXT DEFAULT 'manual', -- manual, automatic
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
                
                -- Sync devices
                CREATE TABLE IF NOT EXISTS sync_devices (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    device_name TEXT NOT NULL,
                    device_type TEXT, -- desktop, mobile, tablet
                    last_sync TIMESTAMP,
                    status TEXT DEFAULT 'offline', -- online, offline
                    ip_address TEXT,
                    sync_key TEXT, -- for P2P authentication
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
                
                -- Audit log
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT NOT NULL,
                    details TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
                
                -- Sessions for tracking active logins
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    token_hash TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
                
                -- Insert default folders for new users
                INSERT OR IGNORE INTO folders (id, user_id, name, color) VALUES 
                ('default', 0, 'Default', 'bg-gray-500');
            """)
    
    def execute_query(self, query: str, params: tuple = ()) -> List[Dict]:
        """Execute query and return results as list of dictionaries"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """Execute update/insert query and return affected rows"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(query, params)
            conn.commit()
            return cursor.rowcount
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        users = self.execute_query(
            "SELECT * FROM users WHERE username = ?", (username,)
        )
        return users[0] if users else None
    
    def create_user(self, username: str, email: str, password_hash: str) -> int:
        """Create new user and return user ID"""
        cursor = sqlite3.connect(self.db_path).cursor()
        cursor.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        """, (username, email, password_hash))
        
        user_id = cursor.lastrowid
        
        # Create default folders for new user
        default_folders = [
            ('default', 'Default', 'bg-gray-500'),
            ('work', 'Work', 'bg-blue-500'),
            ('personal', 'Personal', 'bg-green-500'),
            ('banking', 'Banking', 'bg-red-500'),
        ]
        
        for folder_id, name, color in default_folders:
            folder_uuid = f"{folder_id}_{user_id}" if folder_id != 'default' else f"default_{user_id}"
            cursor.execute("""
                INSERT INTO folders (id, user_id, name, color)
                VALUES (?, ?, ?, ?)
            """, (folder_uuid, user_id, name, color))
        
        cursor.connection.commit()
        cursor.close()
        
        return user_id
    
    def log_action(self, user_id: Optional[int], action: str, details: str = None, 
                   ip_address: str = None, user_agent: str = None):
        """Log user action"""
        self.execute_update("""
            INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, action, details, ip_address, user_agent))

# Global database instance
db = DatabaseManager("backend/database/vault.db")
