#!/usr/bin/env python3
"""
FortiVault Backend - Simplified Version
Handles basic password storage without complex dependencies
"""

import os
import json
import sqlite3
import hashlib
import secrets
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="FortiVault Backend",
    description="Secure Password Manager Backend",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DB_PATH = Path("database/vault.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Pydantic models
class MasterPasswordRequest(BaseModel):
    password: str

class PasswordEntry(BaseModel):
    title: str
    username: str
    password: str
    url: Optional[str] = None
    notes: Optional[str] = None
    folder: str = "Default"

class VaultStats(BaseModel):
    total_passwords: int
    weak_passwords: int
    strong_passwords: int
    security_score: int

# Simple database manager
def init_database():
    """Initialize database with required tables"""
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS master_auth (
                id INTEGER PRIMARY KEY,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS passwords (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                url TEXT,
                notes TEXT,
                folder TEXT DEFAULT 'Default',
                strength TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def calculate_password_strength(password: str) -> str:
    """Calculate password strength"""
    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if any(c.islower() for c in password):
        score += 1
    if any(c.isupper() for c in password):
        score += 1
    if any(c.isdigit() for c in password):
        score += 1
    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        score += 1
    
    if score <= 2:
        return "weak"
    elif score <= 4:
        return "fair"
    elif score <= 5:
        return "good"
    else:
        return "strong"

# Initialize database
init_database()

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.post("/auth/setup")
async def setup_master_password(request: MasterPasswordRequest):
    """Setup initial master password"""
    with sqlite3.connect(DB_PATH) as conn:
        # Check if master password already exists
        cursor = conn.execute("SELECT id FROM master_auth LIMIT 1")
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Master password already exists"
            )
        
        # Store hashed password
        password_hash = hash_password(request.password)
        conn.execute(
            "INSERT INTO master_auth (password_hash) VALUES (?)",
            (password_hash,)
        )
        conn.commit()
    
    return {"message": "Master password setup successfully"}

@app.post("/auth/login")
async def login(request: MasterPasswordRequest):
    """Authenticate with master password"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT password_hash FROM master_auth LIMIT 1")
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No master password set"
            )
        
        stored_hash = result[0]
        if hash_password(request.password) != stored_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid master password"
            )
    
    return {
        "access_token": "demo-token",
        "token_type": "bearer"
    }

@app.get("/vault/stats", response_model=VaultStats)
async def get_vault_stats():
    """Get vault statistics"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT strength FROM passwords")
        passwords = cursor.fetchall()
    
    total = len(passwords)
    weak = sum(1 for p in passwords if p[0] == 'weak')
    strong = sum(1 for p in passwords if p[0] == 'strong')
    
    # Calculate security score
    if total == 0:
        security_score = 100
    else:
        security_score = max(0, 100 - (weak * 20) + (strong * 5))
        security_score = min(100, security_score)
    
    return VaultStats(
        total_passwords=total,
        weak_passwords=weak,
        strong_passwords=strong,
        security_score=security_score
    )

@app.get("/vault/passwords")
async def get_passwords():
    """Get all passwords"""
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute("""
            SELECT id, title, username, password, url, notes,
                   folder, strength, created_at, updated_at
            FROM passwords ORDER BY updated_at DESC
        """)
        passwords = [dict(row) for row in cursor.fetchall()]
    
    return passwords

@app.post("/vault/passwords")
async def add_password(password_entry: PasswordEntry):
    """Add new password"""
    password_id = secrets.token_urlsafe(16)
    strength = calculate_password_strength(password_entry.password)
    
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO passwords 
            (id, title, username, password, url, notes, folder, strength)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            password_id,
            password_entry.title,
            password_entry.username,
            password_entry.password,
            password_entry.url,
            password_entry.notes,
            password_entry.folder,
            strength
        ))
        conn.commit()
    
    return {"message": "Password added successfully", "id": password_id}

@app.put("/vault/passwords/{password_id}")
async def update_password(password_id: str, password_entry: PasswordEntry):
    """Update existing password"""
    strength = calculate_password_strength(password_entry.password)
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("""
            UPDATE passwords SET
            title = ?, username = ?, password = ?, url = ?,
            notes = ?, folder = ?, strength = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            password_entry.title,
            password_entry.username,
            password_entry.password,
            password_entry.url,
            password_entry.notes,
            password_entry.folder,
            strength,
            password_id
        ))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Password not found")
        
        conn.commit()
    
    return {"message": "Password updated successfully"}

@app.delete("/vault/passwords/{password_id}")
async def delete_password(password_id: str):
    """Delete password"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("DELETE FROM passwords WHERE id = ?", (password_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Password not found")
        
        conn.commit()
    
    return {"message": "Password deleted successfully"}

if __name__ == "__main__":
    print("🛡️  Starting FortiVault Backend (Simplified)...")
    print("📊 Database:", DB_PATH)
    print("🌐 API will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        "simple_main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
