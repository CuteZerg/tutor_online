import enum
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey, Table
from sqlalchemy.orm import relationship
from src.db.base import Base

class Role(str, enum.Enum):
    TUTOR = "tutor"
    STUDENT = "student"
    PARENT = "parent"

# Association table for Parent-Student relationship
parent_student_association = Table(
    'parent_student',
    Base.metadata,
    Column('parent_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('student_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)
    is_active = Column(Boolean, default=True)

    # For Student: remaining paid lessons
    balance = Column(Integer, default=0)

    # Self-referential relationships for Parent <-> Student
    children = relationship(
        "User",
        secondary=parent_student_association,
        primaryjoin=id == parent_student_association.c.parent_id,
        secondaryjoin=id == parent_student_association.c.student_id,
        backref="parents"
    )
