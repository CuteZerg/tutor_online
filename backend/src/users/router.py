from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db.database import get_db
from src.users.models import User, Role, parent_student_association
from src.users.schemas import UserCreate, UserResponse
from src.auth.dependencies import get_current_active_user
from src.auth.utils import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
async def create_user(
    user_in: UserCreate, 
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Only Tutor can create other users (Student, Parent)
    if current_user.role != Role.TUTOR:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != Role.TUTOR:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

@router.get("/children", response_model=List[UserResponse])
async def list_children(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != Role.PARENT:
        raise HTTPException(status_code=403, detail="Только родители могут просматривать своих детей")
    
    children_result = await db.execute(
        select(User)
        .join(parent_student_association, User.id == parent_student_association.c.student_id)
        .filter(parent_student_association.c.parent_id == current_user.id)
    )
    children = children_result.scalars().all()
    return children

@router.post("/add-balance", response_model=UserResponse)
async def add_balance(
    amount_in: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    student_id = amount_in.get("student_id")
    target_user_id = current_user.id

    if student_id:
        if current_user.role != Role.PARENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только родители могут пополнять баланс детей"
            )
        
        # Verify if student is parent's child
        assoc_check = await db.execute(
            select(parent_student_association)
            .filter(parent_student_association.c.parent_id == current_user.id)
            .filter(parent_student_association.c.student_id == student_id)
        )
        if not assoc_check.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот студент не является вашим ребенком"
            )
        target_user_id = student_id

    result = await db.execute(select(User).filter(User.id == target_user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.balance += amount_in.get("amount", 0)
    await db.commit()
    await db.refresh(user)
    return user
