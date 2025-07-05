#!/usr/bin/env python3
"""
Simple test script for FortiVault
"""

import sys
from pathlib import Path

def test_basic_functionality():
    """Test basic vault functionality"""
    print("🧪 Testing FortiVault Basic Functionality")
    print("=" * 45)
    
    try:
        from simple_main import SimpleVault
        
        # Create vault instance
        vault = SimpleVault()
        print("✅ Vault instance created")
        
        # Test master password setup
        test_password = "TestPassword123!"
        if vault.setup_master_password(test_password):
            print("✅ Master password setup successful")
        else:
            print("❌ Master password setup failed")
            return False
        
        # Test authentication
        if vault.authenticate(test_password):
            print("✅ Authentication successful")
        else:
            print("❌ Authentication failed")
            return False
        
        # Test adding password
        if vault.add_password("Test Site", "testuser", "testpass123", "https://test.com"):
            print("✅ Password addition successful")
        else:
            print("❌ Password addition failed")
            return False
        
        # Test retrieving passwords
        passwords = vault.get_passwords()
        if passwords and len(passwords) > 0:
            print(f"✅ Password retrieval successful ({len(passwords)} passwords)")
            print(f"   First password: {passwords[0]['title']}")
        else:
            print("❌ Password retrieval failed")
            return False
        
        # Test folders
        folders = vault.get_folders()
        if folders and len(folders) > 0:
            print(f"✅ Folder retrieval successful ({len(folders)} folders)")
        else:
            print("❌ Folder retrieval failed")
            return False
        
        print("\n🎉 All tests passed!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please run the installation script first")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_encryption():
    """Test encryption functionality"""
    print("\n🔐 Testing Encryption")
    print("=" * 25)
    
    try:
        from simple_main import SimpleVault
        import os
        import base64
        
        vault = SimpleVault()
        
        # Test key derivation
        password = "TestPassword123!"
        salt = os.urandom(16)
        key = vault.derive_key(password, salt)
        
        if key:
            print("✅ Key derivation successful")
        else:
            print("❌ Key derivation failed")
            return False
        
        # Test encryption/decryption
        test_data = "This is secret data!"
        encrypted = vault.encrypt_data(test_data, key)
        decrypted = vault.decrypt_data(encrypted, key)
        
        if decrypted == test_data:
            print("✅ Encryption/decryption successful")
        else:
            print("❌ Encryption/decryption failed")
            print(f"   Original: {test_data}")
            print(f"   Decrypted: {decrypted}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Encryption test failed: {e}")
        return False

if __name__ == "__main__":
    success = True
    
    # Test basic functionality
    if not test_basic_functionality():
        success = False
    
    # Test encryption
    if not test_encryption():
        success = False
    
    if success:
        print("\n🎉 All tests completed successfully!")
        print("\nYou can now:")
        print("1. Run 'python3 simple_main.py' for interactive demo")
        print("2. Run 'python3 main.py' for full API server")
    else:
        print("\n❌ Some tests failed")
        print("Please check the installation and try again")
        sys.exit(1)
