from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .models import LessonStatus

class LessonBase(BaseModel):
    title: Optional[str] = None
    start_time: datetime
    end_time: datetime
    price: int = 0

class LessonCreate(LessonBase):
    student_id: Optional[int] = None

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[LessonStatus] = None
    student_id: Optional[int] = None

class LessonResponse(LessonBase):
    id: int
    tutor_id: int
    student_id: Optional[int]
    status: LessonStatus

    class Config:
        from_attributes = True

class CopyWeekRequest(BaseModel):
    date: datetime
