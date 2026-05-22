import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from typing import List

from src.db.database import get_db
from src.users.models import User, Role, parent_student_association
from src.auth.dependencies import get_current_active_user
from src.ws.router import manager

from .models import Message
from .schemas import MessageCreate, MessageResponse, ContactResponse

router = APIRouter(prefix="/chat", tags=["Chat"])



@router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    contacts = []
    if current_user.role == Role.TUTOR:
        # Get all students
        result = await db.execute(select(User).filter(User.role == Role.STUDENT))
        contacts = result.scalars().all()
    elif current_user.role == Role.STUDENT:
        # Get all tutors
        result = await db.execute(select(User).filter(User.role == Role.TUTOR))
        contacts = result.scalars().all()
    elif current_user.role == Role.PARENT:
        # Get all tutors
        result = await db.execute(select(User).filter(User.role == Role.TUTOR))
        contacts = result.scalars().all()

    response = []
    for contact in contacts:
        # Get last message
        stmt = select(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == contact.id),
                and_(Message.sender_id == contact.id, Message.receiver_id == current_user.id)
            )
        ).order_by(desc(Message.created_at)).limit(1)
        last_msg_res = await db.execute(stmt)
        last_msg = last_msg_res.scalars().first()

        # Get unread count
        unread_stmt = select(Message).filter(
            Message.sender_id == contact.id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        )
        unread_res = await db.execute(unread_stmt)
        unread_count = len(unread_res.scalars().all())

        response.append({
            "id": contact.id,
            "full_name": contact.full_name,
            "email": contact.email,
            "role": contact.role.value,
            "last_message": last_msg,
            "unread_count": unread_count
        })

    return response

@router.get("/messages/{contact_id}", response_model=List[MessageResponse])
async def get_messages(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = select(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == contact_id),
            and_(Message.sender_id == contact_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc())
    
    result = await db.execute(stmt)
    messages = result.scalars().all()

    # Mark as read
    marked_read = False
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
            marked_read = True
    await db.commit()

    if marked_read:
        await manager.send_personal_message(f"CHAT_READ:{current_user.id}", contact_id)

    return messages

@router.post("/messages", response_model=MessageResponse)
async def send_message(
    msg_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        content=msg_in.content,
        attachment_url=msg_in.attachment_url,
        code_snippet=msg_in.code_snippet
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)

    # Broadcast via WS
    # Format a special message to the receiver
    await manager.send_personal_message(f"CHAT_MESSAGE:{current_user.id}", msg_in.receiver_id)

    return new_msg


