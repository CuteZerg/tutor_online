from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid

from src.db.database import get_db
from src.users.models import User, Role
from src.auth.dependencies import get_current_user, get_current_active_user
from src.core.s3 import s3_service
from src.files.models import File as DBFile
from fastapi import Request

router = APIRouter(prefix="/files", tags=["Files"])

async def get_user_for_file(
    request: Request,
    token: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> User:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        actual_token = auth_header.split(" ")[1]
    else:
        actual_token = token
        
    if not actual_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
    user = await get_current_user(token=actual_token, db=db)
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    shared_with_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # Upload to S3
        s3_key = s3_service.upload_file(file.file, file.filename, file.content_type)
        
        # Create DB record
        db_file = DBFile(
            s3_key=s3_key,
            filename=file.filename,
            owner_id=current_user.id,
            shared_with_id=shared_with_id
        )
        db.add(db_file)
        await db.commit()
        await db.refresh(db_file)
        
        return {
            "id": str(db_file.id),
            "filename": db_file.filename,
            "url": f"/files/{db_file.id}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload file: {str(e)}"
        )

@router.get("/{file_id}")
async def get_file(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_user_for_file)
):
    # Fetch file record
    result = await db.execute(select(DBFile).filter(DBFile.id == file_id))
    db_file = result.scalars().first()
    
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        
    # Check permissions
    if current_user.role != Role.TUTOR:
        if db_file.owner_id != current_user.id and db_file.shared_with_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
            
    # Generate presigned URL
    try:
        url = s3_service.generate_presigned_url(db_file.s3_key)
        return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not generate access URL: {str(e)}"
        )
