"""
Vault API endpoints
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel

from services.vault import vault_service

router = APIRouter()

class PasswordCreate(BaseModel):
    title: str
    username: Optional[str] = ""
    password: str
    url: Optional[str] = ""
    notes: Optional[str] = ""
    folder_id: Optional[str] = ""
    is_favorite: Optional[bool] = False

class PasswordUpdate(BaseModel):
    title: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    folder_id: Optional[str] = None
    is_favorite: Optional[bool] = None

class FolderCreate(BaseModel):
    id: str
    name: str
    icon: Optional[str] = ""

@router.get("/passwords")
async def get_passwords(
    search: Optional[str] = Query(None, description="Search term"),
    folder_id: Optional[str] = Query(None, description="Filter by folder ID")
):
    """Get all passwords with optional search and filtering"""
    try:
        if search:
            passwords = await vault_service.search_passwords(search)
        else:
            passwords = await vault_service.get_all_passwords()
        
        # Filter by folder if specified
        if folder_id:
            passwords = [p for p in passwords if p.get('folder_id') == folder_id]
        
        return {
            "passwords": passwords,
            "total": len(passwords)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve passwords: {str(e)}"
        )

@router.get("/passwords/{password_id}")
async def get_password(password_id: int):
    """Get a specific password by ID"""
    try:
        password = await vault_service.get_password_by_id(password_id)
        
        if not password:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Password not found"
            )
        
        return password
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve password: {str(e)}"
        )

@router.post("/passwords")
async def create_password(password_data: PasswordCreate):
    """Create a new password"""
    try:
        password_id = await vault_service.add_password(password_data.dict())
        
        return {
            "id": password_id,
            "message": "Password created successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create password: {str(e)}"
        )

@router.put("/passwords/{password_id}")
async def update_password(password_id: int, password_data: PasswordUpdate):
    """Update an existing password"""
    try:
        # Filter out None values
        update_data = {k: v for k, v in password_data.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided for update"
            )
        
        success = await vault_service.update_password(password_id, update_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Password not found"
            )
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update password: {str(e)}"
        )

@router.delete("/passwords/{password_id}")
async def delete_password(password_id: int):
    """Delete a password"""
    try:
        success = await vault_service.delete_password(password_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Password not found"
            )
        
        return {"message": "Password deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete password: {str(e)}"
        )

@router.get("/folders")
async def get_folders():
    """Get all folders"""
    try:
        folders = await vault_service.get_folders()
        return {"folders": folders}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve folders: {str(e)}"
        )

@router.post("/folders")
async def create_folder(folder_data: FolderCreate):
    """Create a new folder"""
    try:
        folder_id = await vault_service.add_folder(folder_data.dict())
        
        return {
            "id": folder_id,
            "message": "Folder created successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create folder: {str(e)}"
        )

@router.get("/stats")
async def get_vault_stats():
    """Get vault statistics"""
    try:
        stats = await vault_service.get_vault_stats()
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve stats: {str(e)}"
        )

@router.post("/generate-password")
async def generate_password(
    length: int = 16,
    include_uppercase: bool = True,
    include_lowercase: bool = True,
    include_numbers: bool = True,
    include_symbols: bool = True
):
    """Generate a secure password"""
    try:
        import secrets
        import string
        
        if length < 4 or length > 128:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password length must be between 4 and 128 characters"
            )
        
        charset = ""
        if include_lowercase:
            charset += string.ascii_lowercase
        if include_uppercase:
            charset += string.ascii_uppercase
        if include_numbers:
            charset += string.digits
        if include_symbols:
            charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        if not charset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one character type must be selected"
            )
        
        password = ''.join(secrets.choice(charset) for _ in range(length))
        
        # Calculate strength
        strength = vault_service._calculate_password_strength(password)
        
        return {
            "password": password,
            "strength": strength,
            "length": len(password)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate password: {str(e)}"
        )

# Export router
vault_router = router
