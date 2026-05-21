from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
from livekit import api

from src.db.database import get_db
from src.users.models import User, Role
from src.auth.dependencies import get_current_active_user
from src.lessons.models import Lesson

router = APIRouter(prefix="/room", tags=["Room"])

@router.get("/{lesson_id}/token")
async def get_room_token(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Fetch lesson
    result = await db.execute(select(Lesson).filter(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Check permissions
    if current_user.role == Role.STUDENT and lesson.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your lesson")
    if current_user.role == Role.TUTOR and lesson.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your lesson")
    if current_user.role == Role.PARENT:
        raise HTTPException(status_code=403, detail="Parents cannot join rooms")

    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="LiveKit credentials missing")
        
    room_name = f"lesson_{lesson_id}"
    identity = f"user_{current_user.id}"
    
    token = api.AccessToken(api_key, api_secret)
    token.with_identity(identity)
    token.with_name(current_user.full_name)
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True # Needed for whiteboard sync
    ))
    
    return {"token": token.to_jwt()}
