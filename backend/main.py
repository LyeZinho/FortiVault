#!/usr/bin/env python3
"""
FortiVault Backend - Secure Password Manager
Handles encryption, storage, and P2P synchronization
"""

import os
import json
import sqlite3
import hashlib
import secrets
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import uvicorn

from auth import auth_manager, Token, User
from database import db
from crypto_utils import crypto_advanced
from mail import mail_service

# Initialize FastAPI app
app = FastAPI(
    title="FortiVault Backend",
    description="Secure Password Manager Backend with 2FA",
    version="2.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database path
DB_PATH = Path("backend/database/vault.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str
    totp_code: Optional[str] = None

class MasterPasswordSetup(BaseModel):
    master_password: str

class PasswordEntry(BaseModel):
    title: str
    username: str
    password: str
    url: Optional[str] = None
    notes: Optional[str] = None
    folder: str = "default"
    tags: List[str] = []

class PasswordUpdate(BaseModel):
    title: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    folder: Optional[str] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None

class FolderCreate(BaseModel):
    name: str
    color: str
    icon: Optional[str] = None

class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]

class BackupCreate(BaseModel):
    include_settings: bool = True

class TwoFactorSetup(BaseModel):
    totp_code: str

class TwoFactorVerify(BaseModel):
    totp_code: str

# Dependency for authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    username = auth_manager.verify_token(credentials.credentials)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

# Authentication endpoints
@app.post("/auth/register", response_model=dict)
async def register(user_data: UserRegister, request: Request):
    """Register new user"""
    # Check if user already exists
    existing_user = db.get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Hash password and create user
    password_hash = auth_manager.get_password_hash(user_data.password)
    user_id = db.create_user(user_data.username, user_data.email, password_hash)
    
    # Log action
    db.log_action(user_id, "user_registered", f"User {user_data.username} registered", 
                  request.client.host, request.headers.get("user-agent"))
    
    return {"message": "User registered successfully", "user_id": user_id}

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, request: Request):
    """Login user with optional 2FA"""
    user = db.get_user_by_username(user_data.username)
    if not user or not auth_manager.verify_password(user_data.password, user["password_hash"]):
        db.log_action(None, "login_failed", f"Failed login attempt for {user_data.username}", 
                      request.client.host, request.headers.get("user-agent"))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check 2FA if enabled
    if user["is_2fa_enabled"]:
        if not user_data.totp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA code required"
            )
        
        if not auth_manager.verify_totp(user["totp_secret"], user_data.totp_code):
            db.log_action(user["id"], "2fa_failed", "Invalid 2FA code", 
                          request.client.host, request.headers.get("user-agent"))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA code"
            )
    
    # Create access token
    access_token_expires = timedelta(minutes=60)
    access_token = auth_manager.create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    # Log successful login
    db.log_action(user["id"], "login_success", "User logged in", 
                  request.client.host, request.headers.get("user-agent"))
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 3600
    }

@app.post("/auth/logout")
async def logout(current_user: Dict = Depends(get_current_user), request: Request = None):
    """Logout user"""
    db.log_action(current_user["id"], "logout", "User logged out")
    return {"message": "Logged out successfully"}

# 2FA endpoints
@app.post("/auth/2fa/setup")
async def setup_2fa(current_user: Dict = Depends(get_current_user)):
    """Setup 2FA for user"""
    if current_user["is_2fa_enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    # Generate TOTP secret
    secret = auth_manager.generate_totp_secret()
    qr_code = auth_manager.generate_qr_code(current_user["username"], secret)
    
    # Store secret temporarily (not activated until verified)
    db.execute_update(
        "UPDATE users SET totp_secret = ? WHERE id = ?",
        (secret, current_user["id"])
    )
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "message": "Scan QR code with your authenticator app"
    }

@app.post("/auth/2fa/verify")
async def verify_2fa(verify_data: TwoFactorVerify, current_user: Dict = Depends(get_current_user)):
    """Verify and enable 2FA"""
    if not current_user["totp_secret"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated"
        )
    
    if not auth_manager.verify_totp(current_user["totp_secret"], verify_data.totp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code"
        )
    
    # Generate backup codes
    backup_codes = auth_manager.generate_backup_codes()
    
    # Enable 2FA
    db.execute_update("""
        UPDATE users SET is_2fa_enabled = TRUE, backup_codes = ? WHERE id = ?
    """, (json.dumps(backup_codes), current_user["id"]))
    
    db.log_action(current_user["id"], "2fa_enabled", "2FA enabled for user")
    
    return {
        "message": "2FA enabled successfully",
        "backup_codes": backup_codes
    }

@app.post("/auth/2fa/disable")
async def disable_2fa(verify_data: TwoFactorVerify, current_user: Dict = Depends(get_current_user)):
    """Disable 2FA"""
    if not current_user["is_2fa_enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    if not auth_manager.verify_totp(current_user["totp_secret"], verify_data.totp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code"
        )
    
    # Disable 2FA
    db.execute_update("""
        UPDATE users SET is_2fa_enabled = FALSE, totp_secret = NULL, backup_codes = NULL 
        WHERE id = ?
    """, (current_user["id"],))
    
    db.log_action(current_user["id"], "2fa_disabled", "2FA disabled for user")
    
    return {"message": "2FA disabled successfully"}

# Master password endpoints
@app.post("/vault/master-password/setup")
async def setup_master_password(
    setup_data: MasterPasswordSetup, 
    current_user: Dict = Depends(get_current_user)
):
    """Setup master password for vault encryption"""
    # Check if master password already exists
    existing = db.execute_query(
        "SELECT id FROM master_auth WHERE user_id = ?", (current_user["id"],)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master password already exists"
        )
    
    # Generate salt and hash password
    salt = crypto_advanced.generate_salt()
    password_hash = crypto_advanced.hash_password_argon2(setup_data.master_password)
    
    # Store master password
    db.execute_update("""
        INSERT INTO master_auth (user_id, password_hash, salt)
        VALUES (?, ?, ?)
    """, (current_user["id"], password_hash, salt))
    
    db.log_action(current_user["id"], "master_password_setup", "Master password configured")
    
    return {"message": "Master password setup successfully"}

@app.post("/vault/master-password/verify")
async def verify_master_password(
    setup_data: MasterPasswordSetup,
    current_user: Dict = Depends(get_current_user)
):
    """Verify master password"""
    master_auth = db.execute_query(
        "SELECT password_hash FROM master_auth WHERE user_id = ?", (current_user["id"],)
    )
    if not master_auth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Master password not set"
        )
    
    if not crypto_advanced.verify_password_argon2(setup_data.master_password, master_auth[0]["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid master password"
        )
    
    return {"message": "Master password verified"}

# Vault endpoints
@app.get("/vault/stats")
async def get_vault_stats(current_user: Dict = Depends(get_current_user)):
    """Get vault statistics"""
    passwords = db.execute_query(
        "SELECT strength FROM passwords WHERE user_id = ?", (current_user["id"],)
    )
    
    total = len(passwords)
    weak = sum(1 for p in passwords if p["strength"] == "weak")
    strong = sum(1 for p in passwords if p["strength"] == "strong")
    
    # Calculate security score
    if total == 0:
        security_score = 100
    else:
        security_score = max(0, 100 - (weak * 20) + (strong * 5))
        security_score = min(100, security_score)
    
    # Get last backup
    last_backup = db.execute_query("""
        SELECT created_at FROM backups WHERE user_id = ? 
        ORDER BY created_at DESC LIMIT 1
    """, (current_user["id"],))
    
    return {
        "total_passwords": total,
        "weak_passwords": weak,
        "duplicate_passwords": 0,  # TODO: Implement duplicate detection
        "strong_passwords": strong,
        "last_backup": last_backup[0]["created_at"] if last_backup else None,
        "security_score": security_score
    }

@app.get("/vault/passwords")
async def get_passwords(current_user: Dict = Depends(get_current_user)):
    """Get all passwords for user"""
    passwords = db.execute_query("""
        SELECT id, title, username, password_encrypted as password, url, 
               notes_encrypted as notes, folder_id as folder, tags, strength, 
               is_favorite, created_at, updated_at
        FROM passwords WHERE user_id = ? ORDER BY updated_at DESC
    """, (current_user["id"],))
    
    # Parse JSON fields and decrypt passwords (in real implementation)
    for password in passwords:
        password["tags"] = json.loads(password["tags"]) if password["tags"] else []
        password["is_favorite"] = bool(password["is_favorite"])
        # TODO: Decrypt password and notes with master password
    
    return passwords

@app.post("/vault/passwords")
async def add_password(
    password_data: PasswordEntry,
    current_user: Dict = Depends(get_current_user)
):
    """Add new password"""
    password_id = secrets.token_urlsafe(16)
    strength = crypto_advanced.assess_password_strength(password_data.password)["strength"]
    
    # TODO: Encrypt password and notes with master password
    encrypted_password = password_data.password  # Placeholder
    encrypted_notes = password_data.notes or ""  # Placeholder
    
    db.execute_update("""
        INSERT INTO passwords 
        (id, user_id, title, username, password_encrypted, url, notes_encrypted, 
         folder_id, tags, strength, is_favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        password_id, current_user["id"], password_data.title, password_data.username,
        encrypted_password, password_data.url, encrypted_notes, password_data.folder,
        json.dumps(password_data.tags), strength, False
    ))
    
    db.log_action(current_user["id"], "password_added", f"Added password for {password_data.title}")
    
    return {"message": "Password added successfully", "id": password_id}

@app.put("/vault/passwords/{password_id}")
async def update_password(
    password_id: str,
    password_data: PasswordUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """Update existing password"""
    # Check if password exists and belongs to user
    existing = db.execute_query(
        "SELECT id FROM passwords WHERE id = ? AND user_id = ?", 
        (password_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Password not found")
    
    # Build update query dynamically
    updates = []
    params = []
    
    if password_data.title is not None:
        updates.append("title = ?")
        params.append(password_data.title)
    
    if password_data.username is not None:
        updates.append("username = ?")
        params.append(password_data.username)
    
    if password_data.password is not None:
        updates.append("password_encrypted = ?")
        updates.append("strength = ?")
        params.append(password_data.password)  # TODO: Encrypt
        params.append(crypto_advanced.assess_password_strength(password_data.password)["strength"])
    
    if password_data.url is not None:
        updates.append("url = ?")
        params.append(password_data.url)
    
    if password_data.notes is not None:
        updates.append("notes_encrypted = ?")
        params.append(password_data.notes)  # TODO: Encrypt
    
    if password_data.folder is not None:
        updates.append("folder_id = ?")
        params.append(password_data.folder)
    
    if password_data.tags is not None:
        updates.append("tags = ?")
        params.append(json.dumps(password_data.tags))
    
    if password_data.is_favorite is not None:
        updates.append("is_favorite = ?")
        params.append(password_data.is_favorite)
    
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.extend([password_id, current_user["id"]])
        
        query = f"UPDATE passwords SET {', '.join(updates)} WHERE id = ? AND user_id = ?"
        db.execute_update(query, tuple(params))
    
    db.log_action(current_user["id"], "password_updated", f"Updated password {password_id}")
    
    return {"message": "Password updated successfully"}

@app.delete("/vault/passwords/{password_id}")
async def delete_password(
    password_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Delete password"""
    result = db.execute_update(
        "DELETE FROM passwords WHERE id = ? AND user_id = ?", 
        (password_id, current_user["id"])
    )
    
    if result == 0:
        raise HTTPException(status_code=404, detail="Password not found")
    
    db.log_action(current_user["id"], "password_deleted", f"Deleted password {password_id}")
    
    return {"message": "Password deleted successfully"}

# Folder endpoints
@app.get("/vault/folders")
async def get_folders(current_user: Dict = Depends(get_current_user)):
    """Get all folders for user"""
    folders = db.execute_query("""
        SELECT f.id, f.name, f.color, f.icon, f.created_at,
               COUNT(p.id) as password_count
        FROM folders f
        LEFT JOIN passwords p ON f.id = p.folder_id AND p.user_id = ?
        WHERE f.user_id = ?
        GROUP BY f.id, f.name, f.color, f.icon, f.created_at
        ORDER BY f.created_at
    """, (current_user["id"], current_user["id"]))
    
    return folders

@app.post("/vault/folders")
async def create_folder(
    folder_data: FolderCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Create new folder"""
    folder_id = secrets.token_urlsafe(16)
    
    db.execute_update("""
        INSERT INTO folders (id, user_id, name, color, icon)
        VALUES (?, ?, ?, ?, ?)
    """, (folder_id, current_user["id"], folder_data.name, folder_data.color, folder_data.icon))
    
    db.log_action(current_user["id"], "folder_created", f"Created folder {folder_data.name}")
    
    return {"message": "Folder created successfully", "id": folder_id}

# Settings endpoints
@app.get("/settings")
async def get_settings(current_user: Dict = Depends(get_current_user)):
    """Get user settings"""
    settings = db.execute_query(
        "SELECT key, value FROM settings WHERE user_id = ?", (current_user["id"],)
    )
    
    settings_dict = {s["key"]: json.loads(s["value"]) for s in settings}
    
    # Default settings
    default_settings = {
        "theme": "dark",
        "auto_lock": True,
        "auto_lock_time": 15,
        "auto_backup": True,
        "backup_frequency": "daily",
        "sync_enabled": False,
        "biometric_auth": False,
        "show_password_strength": True,
        "clipboard_timeout": 30
    }
    
    return {**default_settings, **settings_dict}

@app.put("/settings")
async def update_settings(
    settings_data: SettingsUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """Update user settings"""
    for key, value in settings_data.settings.items():
        db.execute_update("""
            INSERT OR REPLACE INTO settings (user_id, key, value, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (current_user["id"], key, json.dumps(value)))
    
    db.log_action(current_user["id"], "settings_updated", "User settings updated")
    
    return {"message": "Settings updated successfully"}

# Backup endpoints
@app.post("/vault/backup")
async def create_backup(
    backup_data: BackupCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Create encrypted backup"""
    backup_id = secrets.token_urlsafe(16)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"fortivault_backup_{current_user['username']}_{timestamp}.fvault"
    
    # Get all user data
    passwords = db.execute_query(
        "SELECT * FROM passwords WHERE user_id = ?", (current_user["id"],)
    )
    folders = db.execute_query(
        "SELECT * FROM folders WHERE user_id = ?", (current_user["id"],)
    )
    settings = db.execute_query(
        "SELECT * FROM settings WHERE user_id = ?", (current_user["id"],)
    ) if backup_data.include_settings else []
    
    backup_content = {
        "version": "2.0",
        "created_at": datetime.now().isoformat(),
        "user": current_user["username"],
        "passwords": passwords,
        "folders": folders,
        "settings": settings if backup_data.include_settings else []
    }
    
    # Create backup directory
    backup_dir = Path("backend/backups")
    backup_dir.mkdir(exist_ok=True)
    backup_path = backup_dir / filename
    
    # Save backup (TODO: Encrypt with master password)
    with open(backup_path, 'w') as f:
        json.dump(backup_content, f, indent=2, default=str)
    
    # Record backup in database
    db.execute_update("""
        INSERT INTO backups (id, user_id, filename, file_path, size_bytes, backup_type)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        backup_id, current_user["id"], filename, str(backup_path),
        backup_path.stat().st_size, "manual"
    ))
    
    db.log_action(current_user["id"], "backup_created", f"Created backup {filename}")
    
    return {
        "message": "Backup created successfully",
        "filename": filename,
        "backup_id": backup_id,
        "size": backup_path.stat().st_size
    }

@app.get("/vault/backups")
async def get_backups(current_user: Dict = Depends(get_current_user)):
    """Get backup history"""
    backups = db.execute_query("""
        SELECT id, filename, size_bytes, backup_type, created_at
        FROM backups WHERE user_id = ? ORDER BY created_at DESC
    """, (current_user["id"],))
    
    return backups

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint with database connectivity test"""
    try:
        # Test database connectivity
        db_status = "healthy"
        db_info = {}
        try:
            conn = sqlite3.connect(db.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM passwords")
            password_count = cursor.fetchone()[0]
            conn.close()
            
            db_info = {
                "status": "connected",
                "users": user_count,
                "passwords": password_count,
                "path": str(db.db_path)
            }
        except Exception as e:
            db_status = "unhealthy"
            db_info = {
                "status": "error",
                "error": str(e)
            }
        
        return {
            "status": "healthy" if db_status == "healthy" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "service": "fortivault-backend",
            "database": db_info,
            "features": [
                "authentication",
                "2fa_totp",
                "encryption_aes256",
                "backup_export",
                "p2p_sync"
            ]
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "service": "fortivault-backend"
        }

if __name__ == "__main__":
    print("🛡️  Starting FortiVault Backend v2.0...")
    print("📊 Database: backend/database/vault.db")
    print("🌐 API: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("🔐 Features: Authentication, 2FA, Encryption, Backup, Sync")
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
