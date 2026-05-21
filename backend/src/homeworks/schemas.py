from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .models import HomeworkStatus

class HomeworkBase(BaseModel):
    description: str
    due_date: datetime

class HomeworkCreate(HomeworkBase):
    lesson_id: int

class HomeworkUpdate(BaseModel):
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[HomeworkStatus] = None
    student_code: Optional[str] = None
    grade: Optional[int] = None
    feedback: Optional[str] = None

class HomeworkResponse(HomeworkBase):
    id: int
    lesson_id: int
    status: HomeworkStatus
    student_code: Optional[str]
    grade: Optional[int]
    feedback: Optional[str]

    class Config:
        from_attributes = True

class CodeRunRequest(BaseModel):
    code: str

class CodeRunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
