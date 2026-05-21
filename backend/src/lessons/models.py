from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric
from sqlalchemy.orm import relationship
from src.db.base import Base
import enum

class LessonStatus(str, enum.Enum):
    OPEN = "open"          # Slot created by tutor, no student yet
    PENDING = "pending"    # Tutor assigned student, awaiting student confirmation
    SCHEDULED = "scheduled" # Student booked it / confirmed it
    COMPLETED = "completed" # Lesson finished
    CANCELLED = "cancelled" # Lesson cancelled

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    title = Column(String, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    
    status = Column(Enum(LessonStatus), default=LessonStatus.OPEN, nullable=False)
    price = Column(Integer, nullable=False, default=0) # Price in cents or rubles
    
    tutor = relationship("User", foreign_keys=[tutor_id], backref="lessons_taught")
    student = relationship("User", foreign_keys=[student_id], backref="lessons_attended")
