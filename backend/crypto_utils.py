"""
Advanced cryptography utilities for FortiVault
Handles AES-256 encryption, key derivation, and secure operations
"""

import os
import base64
import secrets
from typing import Tuple, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import argon2

class AdvancedCrypto:
    """Advanced cryptography manager for FortiVault"""
    
    def __init__(self):
        self.ph = argon2.PasswordHasher(
            time_cost=3,      # Number of iterations
            memory_cost=65536, # Memory usage in KB
            parallelism=1,    # Number of parallel threads
            hash_len=32,      # Hash length
            salt_len=16       # Salt length
        )
    
    def generate_salt(self, length: int = 32) -> bytes:
        """Generate cryptographically secure random salt"""
        return secrets.token_bytes(length)
    
    def derive_key_pbkdf2(self, password: str, salt: bytes, iterations: int = 100000) -> bytes:
        """Derive key using PBKDF2 with SHA-256"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=iterations,
            backend=default_backend()
        )
        return kdf.derive(password.encode('utf-8'))
    
    def derive_key_scrypt(self, password: str, salt: bytes) -> bytes:
        """Derive key using Scrypt (more secure but slower)"""
        kdf = Scrypt(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            n=2**14,  # CPU/memory cost parameter
            r=8,      # Block size parameter
            p=1,      # Parallelization parameter
            backend=default_backend()
        )
        return kdf.derive(password.encode('utf-8'))
    
    def encrypt_aes_gcm(self, plaintext: str, key: bytes) -> Tuple[bytes, bytes, bytes]:
        """Encrypt using AES-256-GCM (provides authentication)"""
        # Generate random IV
        iv = secrets.token_bytes(12)  # 96-bit IV for GCM
        
        # Create cipher
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv),
            backend=default_backend()
        )
        
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()
        
        return ciphertext, iv, encryptor.tag
    
    def decrypt_aes_gcm(self, ciphertext: bytes, key: bytes, iv: bytes, tag: bytes) -> str:
        """Decrypt using AES-256-GCM"""
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv, tag),
            backend=default_backend()
        )
        
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        return plaintext.decode('utf-8')
    
    def encrypt_fernet(self, plaintext: str, password: str, salt: Optional[bytes] = None) -> str:
        """Encrypt using Fernet (simpler, includes authentication)"""
        if salt is None:
            salt = self.generate_salt()
        
        # Derive key
        key = self.derive_key_pbkdf2(password, salt)
        key_b64 = base64.urlsafe_b64encode(key)
        
        # Encrypt
        f = Fernet(key_b64)
        encrypted = f.encrypt(plaintext.encode('utf-8'))
        
        # Combine salt + encrypted data
        return base64.urlsafe_b64encode(salt + encrypted).decode('utf-8')
    
    def decrypt_fernet(self, encrypted_data: str, password: str) -> str:
        """Decrypt using Fernet"""
        # Decode and separate salt from encrypted data
        data = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
        salt = data[:32]  # First 32 bytes are salt
        encrypted = data[32:]  # Rest is encrypted data
        
        # Derive key
        key = self.derive_key_pbkdf2(password, salt)
        key_b64 = base64.urlsafe_b64encode(key)
        
        # Decrypt
        f = Fernet(key_b64)
        decrypted = f.decrypt(encrypted)
        
        return decrypted.decode('utf-8')
    
    def hash_password_argon2(self, password: str) -> str:
        """Hash password using Argon2id"""
        return self.ph.hash(password)
    
    def verify_password_argon2(self, password: str, hashed: str) -> bool:
        """Verify password against Argon2 hash"""
        try:
            self.ph.verify(hashed, password)
            return True
        except argon2.exceptions.VerifyMismatchError:
            return False
    
    def generate_secure_password(self, length: int = 16, include_symbols: bool = True) -> str:
        """Generate cryptographically secure password"""
        import string
        
        chars = string.ascii_letters + string.digits
        if include_symbols:
            chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        # Ensure at least one character from each category
        password = [
            secrets.choice(string.ascii_lowercase),
            secrets.choice(string.ascii_uppercase),
            secrets.choice(string.digits),
        ]
        
        if include_symbols:
            password.append(secrets.choice("!@#$%^&*()_+-=[]{}|;:,.<>?"))
        
        # Fill the rest randomly
        for _ in range(length - len(password)):
            password.append(secrets.choice(chars))
        
        # Shuffle the password
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)
    
    def calculate_entropy(self, password: str) -> float:
        """Calculate password entropy in bits"""
        import math
        
        charset_size = 0
        
        if any(c.islower() for c in password):
            charset_size += 26
        if any(c.isupper() for c in password):
            charset_size += 26
        if any(c.isdigit() for c in password):
            charset_size += 10
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            charset_size += 22
        
        if charset_size == 0:
            return 0.0
        
        return len(password) * math.log2(charset_size)
    
    def assess_password_strength(self, password: str) -> dict:
        """Comprehensive password strength assessment"""
        length = len(password)
        entropy = self.calculate_entropy(password)
        
        # Check for common patterns
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_symbol = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        # Calculate score
        score = 0
        if length >= 8:
            score += 1
        if length >= 12:
            score += 1
        if has_lower:
            score += 1
        if has_upper:
            score += 1
        if has_digit:
            score += 1
        if has_symbol:
            score += 1
        if entropy >= 50:
            score += 1
        
        # Determine strength
        if score <= 2:
            strength = "weak"
        elif score <= 4:
            strength = "fair"
        elif score <= 5:
            strength = "good"
        else:
            strength = "strong"
        
        return {
            "strength": strength,
            "score": score,
            "entropy": entropy,
            "length": length,
            "has_lowercase": has_lower,
            "has_uppercase": has_upper,
            "has_digits": has_digit,
            "has_symbols": has_symbol,
            "recommendations": self._get_recommendations(score, length, has_lower, has_upper, has_digit, has_symbol)
        }
    
    def _get_recommendations(self, score: int, length: int, has_lower: bool, 
                           has_upper: bool, has_digit: bool, has_symbol: bool) -> list:
        """Get password improvement recommendations"""
        recommendations = []
        
        if length < 8:
            recommendations.append("Use at least 8 characters")
        elif length < 12:
            recommendations.append("Consider using 12+ characters for better security")
        
        if not has_lower:
            recommendations.append("Add lowercase letters")
        if not has_upper:
            recommendations.append("Add uppercase letters")
        if not has_digit:
            recommendations.append("Add numbers")
        if not has_symbol:
            recommendations.append("Add special characters (!@#$%^&*)")
        
        if score <= 2:
            recommendations.append("This password is very weak - consider using a password generator")
        
        return recommendations

# Global instance
crypto_advanced = AdvancedCrypto()
