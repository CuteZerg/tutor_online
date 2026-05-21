from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.db.database import get_db
from src.users.models import User, Role, parent_student_association
from src.auth.dependencies import get_current_active_user, get_current_tutor
from .models import Lesson, LessonStatus
from .schemas import LessonCreate, LessonUpdate, LessonResponse, CopyWeekRequest
from src.ws.router import manager

router = APIRouter(prefix="/lessons", tags=["Lessons"])

@router.post("/", response_model=LessonResponse)
async def create_lesson(
    lesson_in: LessonCreate, 
    db: AsyncSession = Depends(get_db),
    current_tutor: User = Depends(get_current_tutor)
):
    """
    Tutor creates a new open slot or lesson.
    """
    if lesson_in.end_time <= lesson_in.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Время окончания занятия должно быть позже времени начала"
        )

    # Check for overlaps for this tutor
    stmt = select(Lesson).filter(
        Lesson.tutor_id == current_tutor.id,
        Lesson.start_time < lesson_in.end_time,
        Lesson.end_time > lesson_in.start_time
    )
    result = await db.execute(stmt)
    overlapping_lesson = result.scalars().first()
    if overlapping_lesson:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="В это время у вас уже запланировано другое занятие"
        )

    new_lesson = Lesson(
        tutor_id=current_tutor.id,
        student_id=lesson_in.student_id,
        title=lesson_in.title,
        start_time=lesson_in.start_time,
        end_time=lesson_in.end_time,
        price=lesson_in.price,
        status=LessonStatus.PENDING if lesson_in.student_id else LessonStatus.OPEN
    )
    db.add(new_lesson)
    await db.commit()
    await db.refresh(new_lesson)
    await manager.broadcast("REFRESH")
    return new_lesson

@router.get("/", response_model=List[LessonResponse])
async def get_lessons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all lessons relevant to the current user (either as tutor or student).
    """
    if current_user.role == Role.TUTOR:
        result = await db.execute(select(Lesson).filter(Lesson.tutor_id == current_user.id))
    elif current_user.role == Role.STUDENT:
        # Students see their own lessons and OPEN lessons they can book
        result = await db.execute(
            select(Lesson).filter(
                (Lesson.student_id == current_user.id) | 
                (Lesson.status == LessonStatus.OPEN)
            )
        )
    elif current_user.role == Role.PARENT:
        # Parent sees lessons of their children
        children_ids_query = select(parent_student_association.c.student_id).filter(
            parent_student_association.c.parent_id == current_user.id
        )
        children_ids_res = await db.execute(children_ids_query)
        children_ids = children_ids_res.scalars().all()
        result = await db.execute(select(Lesson).filter(Lesson.student_id.in_(children_ids)))
    else:
        result = await db.execute(select(Lesson))
        
    return result.scalars().all()

@router.patch("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    lesson_update: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Lesson).filter(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Check permissions
    if current_user.role == Role.STUDENT:
        # Student can only book an open lesson
        if lesson.status == LessonStatus.OPEN and lesson_update.status == LessonStatus.SCHEDULED:
            result_user = await db.execute(select(User).filter(User.id == current_user.id))
            db_student = result_user.scalars().first()
            if not db_student:
                raise HTTPException(status_code=404, detail="Student not found")
            if db_student.balance < lesson.price:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Недостаточно баланса на счету для бронирования этого занятия"
                )
            db_student.balance -= lesson.price
            lesson.student_id = current_user.id
            lesson.status = LessonStatus.SCHEDULED
        else:
            raise HTTPException(status_code=403, detail="Not enough privileges to update this lesson")
    elif current_user.role == Role.TUTOR:
        if lesson.tutor_id != current_user.id:
             raise HTTPException(status_code=403, detail="Not your lesson")
        update_data = lesson_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(lesson, key, value)
    
    await db.commit()
    await db.refresh(lesson)
    await manager.broadcast("REFRESH")
    return lesson

@router.patch("/{lesson_id}/confirm", response_model=LessonResponse)
async def confirm_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can confirm lessons")

    result = await db.execute(select(Lesson).filter(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson or lesson.student_id != current_user.id:
        raise HTTPException(status_code=404, detail="Lesson not found or not assigned to you")
        
    if lesson.status != LessonStatus.PENDING:
        raise HTTPException(status_code=400, detail="Lesson is not in pending status")

    user_result = await db.execute(select(User).filter(User.id == current_user.id))
    db_student = user_result.scalars().first()
    
    if db_student.balance < lesson.price:
        raise HTTPException(status_code=400, detail="Недостаточно баланса для подтверждения")
        
    db_student.balance -= lesson.price
    lesson.status = LessonStatus.SCHEDULED
    
    await db.commit()
    await db.refresh(lesson)
    await manager.broadcast("REFRESH")
    return lesson

@router.patch("/{lesson_id}/decline", response_model=LessonResponse)
async def decline_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can decline lessons")

    result = await db.execute(select(Lesson).filter(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson or lesson.student_id != current_user.id:
        raise HTTPException(status_code=404, detail="Lesson not found or not assigned to you")
        
    if lesson.status != LessonStatus.PENDING:
        raise HTTPException(status_code=400, detail="Lesson is not in pending status")

    lesson.status = LessonStatus.OPEN
    lesson.student_id = None
    
    await db.commit()
    await db.refresh(lesson)
    await manager.broadcast("REFRESH")
    return lesson

@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_tutor: User = Depends(get_current_tutor)
):
    result = await db.execute(select(Lesson).filter(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if lesson.tutor_id != current_tutor.id:
        raise HTTPException(status_code=403, detail="Not your lesson")
        
    if lesson.status == LessonStatus.SCHEDULED and lesson.student_id:
        student_res = await db.execute(select(User).filter(User.id == lesson.student_id))
        student = student_res.scalars().first()
        if student:
            student.balance += lesson.price
            
    await db.delete(lesson)
    await db.commit()
    await manager.broadcast("REFRESH")
    return None

import datetime

@router.post("/copy-week")
async def copy_week(
    request: CopyWeekRequest,
    db: AsyncSession = Depends(get_db),
    current_tutor: User = Depends(get_current_tutor)
):
    """
    Copies tutor's lessons from the visible week (containing request.date) to the next week.
    """
    target_date = request.date.replace(hour=0, minute=0, second=0, microsecond=0)
    if target_date.tzinfo is None:
        target_date = target_date.replace(tzinfo=datetime.timezone.utc)
    
    days_since_monday = target_date.weekday()
    start_of_last_week = target_date - datetime.timedelta(days=days_since_monday)
    end_of_last_week = start_of_last_week + datetime.timedelta(days=7)
    
    stmt = select(Lesson).filter(
        Lesson.tutor_id == current_tutor.id,
        Lesson.start_time >= start_of_last_week,
        Lesson.start_time < end_of_last_week
    )
    result = await db.execute(stmt)
    past_lessons = result.scalars().all()
    
    created_count = 0
    for pl in past_lessons:
        new_start = pl.start_time + datetime.timedelta(days=7)
        new_end = pl.end_time + datetime.timedelta(days=7)
        
        # Check overlap
        overlap_stmt = select(Lesson).filter(
            Lesson.tutor_id == current_tutor.id,
            Lesson.start_time < new_end,
            Lesson.end_time > new_start
        )
        overlap_res = await db.execute(overlap_stmt)
        if overlap_res.scalars().first():
            continue # Skip overlapping
            
        new_lesson = Lesson(
            tutor_id=current_tutor.id,
            student_id=pl.student_id,
            title=pl.title,
            start_time=new_start,
            end_time=new_end,
            price=pl.price,
            status=LessonStatus.PENDING if pl.student_id else LessonStatus.OPEN
        )
        db.add(new_lesson)
        created_count += 1
        
    await db.commit()
    if created_count > 0:
        await manager.broadcast("REFRESH")
    return {"copied_count": created_count}
