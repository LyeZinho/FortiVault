"""
Database models for FortiVault
"""

import sqlite3
import aiosqlite
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from core.config import settings

class DatabaseManager:
    """Manages SQLite database operations"""
    
    def __init__(self):
        self.db_path = settings.DATA_DIR / settings.VAULT_FILE
    
    async def get_connection(self):
        """Get database connection"""
        return await aiosqlite.connect(self.db_path)
    
    async def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Execute a SELECT query and return results"""
        async with await self.get_connection() as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def execute_update(self, query: str, params: tuple = ()) -> int:
        """Execute an INSERT/UPDATE/DELETE query"""
        async with await self.get_connection() as db:
            cursor = await db.execute(query, params)
            await db.commit()
            return cursor.lastrowid if cursor.lastrowid else cursor.rowcount

async def init_database():
    """Initialize the database with required tables"""
    db_manager = DatabaseManager()
    
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
        await db_manager.execute_update(table_sql)
    
    # Insert default folders if they don't exist
    default_folders = [
        ('personal', 'Personal'),
        ('work', 'Work'),
        ('social', 'Social Media'),
        ('finance', 'Finance')
    ]
    
    for folder_id, folder_name in default_folders:
        existing = await db_manager.execute_query(
            "SELECT id FROM folders WHERE id = ?", (folder_id,)
        )
        if not existing:
            await db_manager.execute_update(
                "INSERT INTO folders (id, name) VALUES (?, ?)",
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
        existing = await db_manager.execute_query(
            "SELECT key FROM settings WHERE key = ?", (key,)
        )
        if not existing:
            await db_manager.execute_update(
                "INSERT INTO settings (key, value) VALUES (?, ?)",
                (key, value)
            )

# Global database manager instance
db_manager = DatabaseManager()
