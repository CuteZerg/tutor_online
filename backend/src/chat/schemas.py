from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageBase(BaseModel):
    content: Optional[str] = None
    attachment_url: Optional[str] = None
    code_snippet: Optional[str] = None

class MessageCreate(MessageBase):
    receiver_id: int

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ContactResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
