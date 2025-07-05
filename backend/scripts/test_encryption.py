#!/usr/bin/env python3
"""
Test script for encryption functionality
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from core.security import SecurityManager

def test_encryption():
    """Test encryption and decryption functionality"""
    print("Testing FortiVault encryption...")
    
    # Initialize security manager
    security = SecurityManager.initialize()
    
    # Test password hashing
    print("\n1. Testing password hashing...")
    test_password = "MySecurePassword123!"
    hashed = security.hash_master_password(test_password)
    print(f"   Original: {test_password}")
    print(f"   Hashed: {hashed[:50]}...")
    
    # Verify password
    is_valid = security.verify_master_password(test_password, hashed)
    print(f"   Verification: {'✅ PASS' if is_valid else '❌ FAIL'}")
    
    # Test key derivation
    print("\n2. Testing key derivation...")
    salt = security.generate_salt()
    key = security.derive_key_from_password(test_password, salt)
    print(f"   Salt length: {len(salt)} bytes")
    print(f"   Key length: {len(key)} bytes")
    print(f"   Key (hex): {key.hex()[:32]}...")
    
    # Test data encryption
    print("\n3. Testing data encryption...")
    test_data = "This is my secret password: SuperSecret123!"
    encrypted = security.encrypt_data(test_data, key)
    print(f"   Original: {test_data}")
    print(f"   Encrypted: {encrypted['ciphertext'][:32]}...")
    print(f"   IV: {encrypted['iv']}")
    print(f"   Tag: {encrypted['tag']}")
    
    # Test data decryption
    print("\n4. Testing data decryption...")
    decrypted = security.decrypt_data(encrypted, key)
    print(f"   Decrypted: {decrypted}")
    print(f"   Match: {'✅ PASS' if decrypted == test_data else '❌ FAIL'}")
    
    # Test JWT tokens
    print("\n5. Testing JWT tokens...")
    user_data = {"user_id": "test_user", "role": "admin"}
    token = security.generate_jwt_token(user_data)
    print(f"   Token: {token[:50]}...")
    
    payload = security.verify_jwt_token(token)
    print(f"   Payload: {payload}")
    print(f"   Valid: {'✅ PASS' if payload else '❌ FAIL'}")
    
    # Test backup encryption
    print("\n6. Testing backup encryption...")
    backup_key = security.generate_backup_key()
    backup_data = '{"passwords": [{"title": "Test", "password": "secret"}]}'
    
    encrypted_backup = security.encrypt_for_backup(backup_data, backup_key)
    decrypted_backup = security.decrypt_from_backup(encrypted_backup, backup_key)
    
    print(f"   Backup key: {backup_key[:32]}...")
    print(f"   Backup match: {'✅ PASS' if decrypted_backup == backup_data else '❌ FAIL'}")
    
    print("\n🎉 All encryption tests completed!")

if __name__ == "__main__":
    test_encryption()
