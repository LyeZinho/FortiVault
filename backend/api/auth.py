"""
Authentication API endpoints
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from core.security import security_manager
from database.models import db_manager

router = APIRouter()
security = HTTPBearer()

class LoginRequest(BaseModel):
    master_password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    message: str

class SetupRequest(BaseModel):
    master_password: str

@router.post("/setup", response_model=Dict[str, Any])
async def setup_vault(request: SetupRequest):
    """Setup vault with master password"""
    try:
        # Check if vault is already setup
        existing_sessions = await db_manager.execute_query(
            "SELECT COUNT(*) as count FROM auth_sessions WHERE is_active = TRUE"
        )
        
        if existing_sessions and existing_sessions[0]['count'] > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vault is already setup"
            )
        
        # Hash and store master password (in a real implementation, you might want to store this differently)
        hashed_password = security_manager.hash_master_password(request.master_password)
        
        # Store in settings (encrypted)
        await db_manager.execute_update(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            ("master_password_hash", hashed_password)
        )
        
        # Set master key
        success = security_manager.set_master_key(request.master_password)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to setup vault"
            )
        
        # Generate access token
        token = security_manager.generate_jwt_token({"user_id": "local_user"})
        
        # Store session
        await db_manager.execute_update(
            """
            INSERT INTO auth_sessions (session_token, expires_at)
            VALUES (?, datetime('now', '+30 minutes'))
            """,
            (token,)
        )
        
        return {
            "message": "Vault setup successfully",
            "access_token": token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Setup failed: {str(e)}"
        )

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate with master password"""
    try:
        # Get stored password hash
        stored_hash = await db_manager.execute_query(
            "SELECT value FROM settings WHERE key = 'master_password_hash'"
        )
        
        if not stored_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vault not setup. Please setup first."
            )
        
        # Verify master password
        is_valid = security_manager.verify_master_password(
            request.master_password,
            stored_hash[0]['value']
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid master password"
            )
        
        # Set master key
        success = security_manager.set_master_key(request.master_password)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to authenticate"
            )
        
        # Generate access token
        token = security_manager.generate_jwt_token({"user_id": "local_user"})
        
        # Store session
        await db_manager.execute_update(
            """
            INSERT INTO auth_sessions (session_token, expires_at)
            VALUES (?, datetime('now', '+30 minutes'))
            """,
            (token,)
        )
        
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            message="Authentication successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout and invalidate session"""
    try:
        token = credentials.credentials
        
        # Invalidate session
        await db_manager.execute_update(
            "UPDATE auth_sessions SET is_active = FALSE WHERE session_token = ?",
            (token,)
        )
        
        # Clear master key from memory
        security_manager._master_key = None
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@router.get("/status")
async def auth_status():
    """Get authentication status"""
    return {
        "authenticated": security_manager.is_authenticated(),
        "vault_setup": await _is_vault_setup()
    }

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    
    # Verify JWT token
    payload = security_manager.verify_jwt_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Check if session is active
    session = await db_manager.execute_query(
        "SELECT is_active FROM auth_sessions WHERE session_token = ? AND expires_at > datetime('now')",
        (token,)
    )
    
    if not session or not session[0]['is_active']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )
    
    return payload

async def _is_vault_setup() -> bool:
    """Check if vault is setup"""
    stored_hash = await db_manager.execute_query(
        "SELECT value FROM settings WHERE key = 'master_password_hash'"
    )
    return bool(stored_hash)

# Export router
auth_router = router
