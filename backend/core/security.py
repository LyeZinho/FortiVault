"""
Security and encryption utilities for FortiVault
"""

import os
import json
import base64
import hashlib
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime, timedelta

import argon2
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import jwt

from core.config import settings

class SecurityManager:
    """Handles all security operations for FortiVault"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.argon2_hasher = argon2.PasswordHasher(
                time_cost=3,
                memory_cost=65536,
                parallelism=1,
                hash_len=32,
                salt_len=16
            )
            self._master_key: Optional[bytes] = None
            self._keys_file_path = settings.DATA_DIR / settings.KEYS_FILE
            SecurityManager._initialized = True
    
    @classmethod
    def initialize(cls):
        """Initialize the security manager"""
        instance = cls()
        return instance
    
    def hash_master_password(self, password: str) -> str:
        """Hash master password using Argon2"""
        return self.argon2_hasher.hash(password)
    
    def verify_master_password(self, password: str, hashed: str) -> bool:
        """Verify master password against hash"""
        try:
            self.argon2_hasher.verify(hashed, password)
            return True
        except argon2.exceptions.VerifyMismatchError:
            return False
    
    def derive_key_from_password(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from master password using Argon2"""
        # Use Argon2 for key derivation
        kdf = argon2.low_level.hash_secret_raw(
            secret=password.encode(),
            salt=salt,
            time_cost=3,
            memory_cost=65536,
            parallelism=1,
            hash_len=32,
            type=argon2.low_level.Type.ID
        )
        return kdf
    
    def generate_salt(self) -> bytes:
        """Generate a random salt"""
        return os.urandom(16)
    
    def generate_iv(self) -> bytes:
        """Generate a random IV for AES-GCM"""
        return os.urandom(12)  # 96-bit IV for GCM
    
    def encrypt_data(self, data: str, key: bytes) -> Dict[str, str]:
        """Encrypt data using AES-256-GCM"""
        iv = self.generate_iv()
        
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv),
            backend=default_backend()
        )
        
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(data.encode()) + encryptor.finalize()
        
        return {
            'ciphertext': base64.b64encode(ciphertext).decode(),
            'iv': base64.b64encode(iv).decode(),
            'tag': base64.b64encode(encryptor.tag).decode()
        }
    
    def decrypt_data(self, encrypted_data: Dict[str, str], key: bytes) -> str:
        """Decrypt data using AES-256-GCM"""
        ciphertext = base64.b64decode(encrypted_data['ciphertext'])
        iv = base64.b64decode(encrypted_data['iv'])
        tag = base64.b64decode(encrypted_data['tag'])
        
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv, tag),
            backend=default_backend()
        )
        
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        return plaintext.decode()
    
    def set_master_key(self, password: str) -> bool:
        """Set the master key from password"""
        try:
            # Load or create keys file
            keys_data = self._load_or_create_keys_file()
            
            # Derive key from password
            salt = base64.b64decode(keys_data['salt'])
            self._master_key = self.derive_key_from_password(password, salt)
            
            return True
        except Exception as e:
            print(f"Error setting master key: {e}")
            return False
    
    def _load_or_create_keys_file(self) -> Dict[str, Any]:
        """Load or create the encrypted keys file"""
        if self._keys_file_path.exists():
            with open(self._keys_file_path, 'r') as f:
                return json.load(f)
        else:
            # Create new keys file
            keys_data = {
                'salt': base64.b64encode(self.generate_salt()).decode(),
                'created_at': datetime.utcnow().isoformat(),
                'version': '1.0'
            }
            
            with open(self._keys_file_path, 'w') as f:
                json.dump(keys_data, f, indent=2)
            
            return keys_data
    
    def get_master_key(self) -> Optional[bytes]:
        """Get the current master key"""
        return self._master_key
    
    def is_authenticated(self) -> bool:
        """Check if user is authenticated (has master key set)"""
        return self._master_key is not None
    
    def generate_jwt_token(self, user_data: Dict[str, Any]) -> str:
        """Generate JWT token for API authentication"""
        payload = {
            'user_id': user_data.get('user_id', 'local_user'),
            'exp': datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            'iat': datetime.utcnow(),
            'type': 'access_token'
        }
        
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def generate_backup_key(self) -> str:
        """Generate a backup key for vault export"""
        return base64.b64encode(os.urandom(32)).decode()
    
    def encrypt_for_backup(self, data: str, backup_key: str) -> Dict[str, str]:
        """Encrypt data for backup using backup key"""
        key = base64.b64decode(backup_key)
        return self.encrypt_data(data, key)
    
    def decrypt_from_backup(self, encrypted_data: Dict[str, str], backup_key: str) -> str:
        """Decrypt data from backup using backup key"""
        key = base64.b64decode(backup_key)
        return self.decrypt_data(encrypted_data, key)

# Global security manager instance
security_manager = SecurityManager()
