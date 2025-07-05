#!/usr/bin/env python3
"""
Simplified FortiVault main application
For testing and development
"""

import asyncio
import sqlite3
import json
import base64
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional

# Simple encryption using Fernet (fallback if cryptography fails)
try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("⚠️  Cryptography not available, using base64 encoding (NOT SECURE)")

class SimpleVault:
    """Simplified vault for testing"""
    
    def __init__(self):
        self.data_dir = Path.home() / ".fortivault"
        self.db_path = self.data_dir / "vault.db"
        self.master_key = None
        
        # Ensure directory exists
        self.data_dir.mkdir(exist_ok=True)
        
        # Initialize database
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                username TEXT,
                password TEXT NOT NULL,
                url TEXT,
                notes TEXT,
                folder_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        
        # Insert default folders
        default_folders = [
            ('personal', 'Personal'),
            ('work', 'Work'),
            ('social', 'Social Media')
        ]
        
        for folder_id, folder_name in default_folders:
            cursor.execute(
                "INSERT OR IGNORE INTO folders (id, name) VALUES (?, ?)",
                (folder_id, folder_name)
            )
        
        conn.commit()
        conn.close()
        print(f"✅ Database initialized: {self.db_path}")
    
    def derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password"""
        if CRYPTO_AVAILABLE:
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            return base64.urlsafe_b64encode(kdf.derive(password.encode()))
        else:
            # Fallback: simple base64 (NOT SECURE)
            return base64.b64encode(password.encode())
    
    def encrypt_data(self, data: str, key: bytes) -> str:
        """Encrypt data"""
        if CRYPTO_AVAILABLE:
            f = Fernet(key)
            return f.encrypt(data.encode()).decode()
        else:
            # Fallback: base64 encoding (NOT SECURE)
            return base64.b64encode(data.encode()).decode()
    
    def decrypt_data(self, encrypted_data: str, key: bytes) -> str:
        """Decrypt data"""
        if CRYPTO_AVAILABLE:
            f = Fernet(key)
            return f.decrypt(encrypted_data.encode()).decode()
        else:
            # Fallback: base64 decoding
            return base64.b64decode(encrypted_data.encode()).decode()
    
    def setup_master_password(self, password: str) -> bool:
        """Setup master password"""
        try:
            # Generate salt
            salt = os.urandom(16)
            
            # Derive key
            self.master_key = self.derive_key(password, salt)
            
            # Store salt
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                ("salt", base64.b64encode(salt).decode())
            )
            cursor.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                ("setup", "true")
            )
            conn.commit()
            conn.close()
            
            print("✅ Master password setup successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to setup master password: {e}")
            return False
    
    def authenticate(self, password: str) -> bool:
        """Authenticate with master password"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get salt
            cursor.execute("SELECT value FROM settings WHERE key = 'salt'")
            result = cursor.fetchone()
            conn.close()
            
            if not result:
                print("❌ Vault not setup")
                return False
            
            salt = base64.b64decode(result[0])
            
            # Derive key and set
            self.master_key = self.derive_key(password, salt)
            
            print("✅ Authentication successful")
            return True
            
        except Exception as e:
            print(f"❌ Authentication failed: {e}")
            return False
    
    def add_password(self, title: str, username: str, password: str, url: str = "", folder_id: str = "personal") -> bool:
        """Add a new password"""
        if not self.master_key:
            print("❌ Not authenticated")
            return False
        
        try:
            # Encrypt password
            encrypted_password = self.encrypt_data(password, self.master_key)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO passwords (title, username, password, url, folder_id)
                VALUES (?, ?, ?, ?, ?)
            """, (title, username, encrypted_password, url, folder_id))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Password '{title}' added successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to add password: {e}")
            return False
    
    def get_passwords(self) -> List[Dict[str, Any]]:
        """Get all passwords"""
        if not self.master_key:
            print("❌ Not authenticated")
            return []
        
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, title, username, password, url, folder_id, created_at
                FROM passwords
                ORDER BY created_at DESC
            """)
            
            rows = cursor.fetchall()
            conn.close()
            
            passwords = []
            for row in rows:
                try:
                    decrypted_password = self.decrypt_data(row['password'], self.master_key)
                    passwords.append({
                        'id': row['id'],
                        'title': row['title'],
                        'username': row['username'],
                        'password': decrypted_password,
                        'url': row['url'],
                        'folder_id': row['folder_id'],
                        'created_at': row['created_at']
                    })
                except Exception as e:
                    print(f"⚠️  Could not decrypt password {row['id']}: {e}")
            
            return passwords
            
        except Exception as e:
            print(f"❌ Failed to get passwords: {e}")
            return []
    
    def get_folders(self) -> List[Dict[str, Any]]:
        """Get all folders"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, name FROM folders ORDER BY name")
            rows = cursor.fetchall()
            
            # Count passwords in each folder
            folders = []
            for row in rows:
                cursor.execute("SELECT COUNT(*) FROM passwords WHERE folder_id = ?", (row['id'],))
                count = cursor.fetchone()[0]
                
                folders.append({
                    'id': row['id'],
                    'name': row['name'],
                    'count': count
                })
            
            conn.close()
            return folders
            
        except Exception as e:
            print(f"❌ Failed to get folders: {e}")
            return []

def interactive_demo():
    """Interactive demo of the vault"""
    print("🛡️  FortiVault Simple Demo")
    print("=" * 40)
    
    vault = SimpleVault()
    
    # Check if setup
    conn = sqlite3.connect(vault.db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = 'setup'")
    is_setup = cursor.fetchone()
    conn.close()
    
    if not is_setup:
        print("🔧 First time setup")
        master_password = input("Enter master password: ")
        if not vault.setup_master_password(master_password):
            return
    else:
        print("🔐 Vault already setup")
        master_password = input("Enter master password: ")
        if not vault.authenticate(master_password):
            return
    
    while True:
        print("\n📋 Options:")
        print("1. Add password")
        print("2. View passwords")
        print("3. View folders")
        print("4. Exit")
        
        choice = input("\nChoose option (1-4): ").strip()
        
        if choice == "1":
            print("\n➕ Add New Password")
            title = input("Title: ")
            username = input("Username: ")
            password = input("Password: ")
            url = input("URL (optional): ")
            
            folders = vault.get_folders()
            print("\nAvailable folders:")
            for folder in folders:
                print(f"  - {folder['id']}: {folder['name']}")
            
            folder_id = input("Folder ID (default: personal): ").strip() or "personal"
            
            vault.add_password(title, username, password, url, folder_id)
        
        elif choice == "2":
            print("\n🔑 Your Passwords:")
            passwords = vault.get_passwords()
            
            if not passwords:
                print("No passwords found")
            else:
                for pwd in passwords:
                    print(f"\n📝 {pwd['title']}")
                    print(f"   Username: {pwd['username']}")
                    print(f"   Password: {'*' * len(pwd['password'])}")
                    print(f"   URL: {pwd['url']}")
                    print(f"   Folder: {pwd['folder_id']}")
                    print(f"   Created: {pwd['created_at']}")
        
        elif choice == "3":
            print("\n📁 Folders:")
            folders = vault.get_folders()
            
            for folder in folders:
                print(f"  📂 {folder['name']} ({folder['count']} passwords)")
        
        elif choice == "4":
            print("\n👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid option")

if __name__ == "__main__":
    try:
        interactive_demo()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
