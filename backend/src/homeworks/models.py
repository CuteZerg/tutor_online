from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from src.db.base import Base
import enum
from datetime import datetime, timezone

class HomeworkStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    GRADED = "graded"

class Homework(Base):
    __tablename__ = "homeworks"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    
    status = Column(Enum(HomeworkStatus), default=HomeworkStatus.PENDING, nullable=False)
    student_code = Column(Text, nullable=True) # Submitted Python code
    grade = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    
    lesson = relationship("Lesson", backref="homeworks")
