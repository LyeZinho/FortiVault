"""
Backup API endpoints
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel

from services.backup import backup_service

router = APIRouter()

class BackupCreateRequest(BaseModel):
    backup_type: Optional[str] = "manual"

class BackupRestoreRequest(BaseModel):
    backup_key: str
    merge: Optional[bool] = False

class BackupVerifyRequest(BaseModel):
    backup_key: str

@router.post("/create")
async def create_backup(request: BackupCreateRequest):
    """Create a new backup"""
    try:
        backup_info = await backup_service.create_backup(request.backup_type)
        
        return {
            "success": True,
            "backup": backup_info,
            "message": "Backup created successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup creation failed: {str(e)}"
        )

@router.get("/history")
async def get_backup_history():
    """Get backup history"""
    try:
        backups = await backup_service.get_backup_history()
        
        return {
            "backups": backups,
            "total": len(backups)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve backup history: {str(e)}"
        )

@router.post("/restore")
async def restore_backup(
    backup_file: UploadFile = File(...),
    backup_key: str = Form(...),
    merge: bool = Form(False)
):
    """Restore from backup file"""
    try:
        # Save uploaded file temporarily
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.fvault') as temp_file:
            content = await backup_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Restore from backup
            result = await backup_service.restore_backup(
                temp_file_path,
                backup_key,
                merge
            )
            
            return {
                "success": True,
                "result": result,
                "message": "Backup restored successfully"
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup restore failed: {str(e)}"
        )

@router.post("/verify")
async def verify_backup(
    backup_file: UploadFile = File(...),
    backup_key: str = Form(...)
):
    """Verify backup file integrity"""
    try:
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.fvault') as temp_file:
            content = await backup_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            verification_result = await backup_service.verify_backup(
                temp_file_path,
                backup_key
            )
            
            return verification_result
            
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup verification failed: {str(e)}"
        )

@router.delete("/{backup_id}")
async def delete_backup(backup_id: int):
    """Delete a backup"""
    try:
        success = await backup_service.delete_backup(backup_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup not found"
            )
        
        return {"message": "Backup deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete backup: {str(e)}"
        )

@router.get("/download/{backup_id}")
async def download_backup(backup_id: int):
    """Download a backup file"""
    try:
        from fastapi.responses import FileResponse
        
        backups = await backup_service.get_backup_history()
        backup = next((b for b in backups if b['id'] == backup_id), None)
        
        if not backup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup not found"
            )
        
        if not backup['file_exists']:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup file not found on disk"
            )
        
        return FileResponse(
            path=backup['file_path'],
            filename=backup['filename'],
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download backup: {str(e)}"
        )

# Export router
backup_router = router
