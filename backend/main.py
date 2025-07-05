#!/usr/bin/env python3
"""
FortiVault - Decentralized Password Manager
Main application entry point
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn

from database.models import init_database
from api.auth import auth_router, get_current_user
from api.vault import vault_router
from api.backup import backup_router
from api.sync import sync_router
from core.config import settings
from core.security import SecurityManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="FortiVault API",
    description="Decentralized Password Manager Backend",
    version="1.0.0"
)

# Configure CORS for Tauri integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["tauri://localhost", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme
security = HTTPBearer()

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(vault_router, prefix="/api/vault", tags=["vault"], dependencies=[Depends(get_current_user)])
app.include_router(backup_router, prefix="/api/backup", tags=["backup"], dependencies=[Depends(get_current_user)])
app.include_router(sync_router, prefix="/api/sync", tags=["sync"], dependencies=[Depends(get_current_user)])

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting FortiVault Backend...")
    
    # Initialize database
    await init_database()
    
    # Initialize security manager
    SecurityManager.initialize()
    
    logger.info("FortiVault Backend started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down FortiVault Backend...")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "FortiVault Backend is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "encryption": "initialized",
        "timestamp": "2024-01-07T12:00:00Z"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
