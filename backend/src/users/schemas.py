from pydantic import BaseModel, EmailStr
from typing import Optional
from src.users.models import Role

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Role

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    balance: int

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
