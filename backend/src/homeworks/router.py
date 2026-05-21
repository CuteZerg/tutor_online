import sys
import subprocess
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.db.database import get_db
from src.users.models import User, Role, parent_student_association
from src.auth.dependencies import get_current_active_user, get_current_tutor
from src.lessons.models import Lesson
from .models import Homework, HomeworkStatus
from .schemas import HomeworkCreate, HomeworkUpdate, HomeworkResponse, CodeRunRequest, CodeRunResponse

router = APIRouter(prefix="/homeworks", tags=["Homeworks"])

@router.post("/", response_model=HomeworkResponse)
async def create_homework(
    homework_in: HomeworkCreate,
    db: AsyncSession = Depends(get_db),
    current_tutor: User = Depends(get_current_tutor)
):
    """
    Tutor creates a homework task for a lesson.
    """
    # Verify the lesson exists and belongs to the tutor
    result = await db.execute(select(Lesson).filter(Lesson.id == homework_in.lesson_id))
    lesson = result.scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.tutor_id != current_tutor.id:
        raise HTTPException(status_code=403, detail="You can only assign homework to your own lessons")
        
    new_homework = Homework(
        lesson_id=homework_in.lesson_id,
        description=homework_in.description,
        due_date=homework_in.due_date,
        status=HomeworkStatus.PENDING
    )
    db.add(new_homework)
    await db.commit()
    await db.refresh(new_homework)
    return new_homework

@router.get("/", response_model=List[HomeworkResponse])
async def get_homeworks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all homework tasks.
    Tutors see tasks for their lessons. Students see tasks assigned to them.
    """
    if current_user.role == Role.TUTOR:
        result = await db.execute(
            select(Homework)
            .join(Lesson)
            .filter(Lesson.tutor_id == current_user.id)
        )
    elif current_user.role == Role.STUDENT:
        result = await db.execute(
            select(Homework)
            .join(Lesson)
            .filter(Lesson.student_id == current_user.id)
        )
    else:
        # Parents see their kids' homework
        result = await db.execute(
            select(Homework)
            .join(Lesson)
            .join(parent_student_association, Lesson.student_id == parent_student_association.c.student_id)
            .filter(parent_student_association.c.parent_id == current_user.id)
        )
        
    return result.scalars().all()

@router.get("/{homework_id}", response_model=HomeworkResponse)
async def get_homework(
    homework_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Homework).filter(Homework.id == homework_id))
    homework = result.scalars().first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
        
    # Verify permission
    result_lesson = await db.execute(select(Lesson).filter(Lesson.id == homework.lesson_id))
    lesson = result_lesson.scalars().first()
    if current_user.role == Role.TUTOR and lesson.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == Role.STUDENT and lesson.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return homework

@router.patch("/{homework_id}", response_model=HomeworkResponse)
async def update_homework(
    homework_id: int,
    homework_update: HomeworkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Homework).filter(Homework.id == homework_id))
    homework = result.scalars().first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
        
    # Get lesson to check access
    result_lesson = await db.execute(select(Lesson).filter(Lesson.id == homework.lesson_id))
    lesson = result_lesson.scalars().first()
    
    if current_user.role == Role.STUDENT:
        # Students can only submit code and change status to SUBMITTED
        if lesson.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if homework_update.student_code is not None:
            homework.student_code = homework_update.student_code
            homework.status = HomeworkStatus.SUBMITTED
    elif current_user.role == Role.TUTOR:
        # Tutors can grade, give feedback, edit details
        if lesson.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        update_data = homework_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(homework, key, value)
            
    await db.commit()
    await db.refresh(homework)
    return homework

@router.post("/run", response_model=CodeRunResponse)
async def run_python_code(
    run_req: CodeRunRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Executes Python code in a sandboxed-ish subprocess with a timeout limit.
    """
    try:
        # Using sys.executable to run inside the same python environment
        # Timeout at 5 seconds to prevent locking the thread/CPU on infinite loops
        proc = subprocess.run(
            [sys.executable, "-c", run_req.code],
            capture_output=True,
            text=True,
            timeout=5.0
        )
        return CodeRunResponse(
            stdout=proc.stdout,
            stderr=proc.stderr,
            exit_code=proc.returncode
        )
    except subprocess.TimeoutExpired:
        return CodeRunResponse(
            stdout="",
            stderr="Execution timed out (5.0s limit exceeded)",
            exit_code=-1
        )
    except Exception as e:
        return CodeRunResponse(
            stdout="",
            stderr=f"System execution error: {str(e)}",
            exit_code=-1
        )
