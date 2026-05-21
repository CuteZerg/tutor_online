import asyncio
from sqlalchemy import select, delete
from src.db.database import AsyncSessionLocal
from src.users.models import User, Role
from src.auth.utils import get_password_hash
from src.lessons.models import Lesson, LessonStatus
from src.homeworks.models import Homework, HomeworkStatus
from datetime import datetime, timedelta, timezone

async def seed_data():
    async with AsyncSessionLocal() as session:
        print("Cleaning up old database records...")
        from src.chat.models import Message
        await session.execute(delete(Message))
        await session.execute(delete(Homework))
        await session.execute(delete(Lesson))
        
        # Clear users and their associations
        from src.users.models import parent_student_association
        await session.execute(delete(parent_student_association))
        await session.execute(delete(User))
        await session.commit()

        print("Seeding database with test users and lessons...")

        # 1. Create Tutor
        tutor = User(
            email="tutor@test.com",
            hashed_password=get_password_hash("tutor123"),
            full_name="Иван Репетиторов",
            role=Role.TUTOR,
            is_active=True,
            balance=0
        )
        session.add(tutor)

        # 2. Create Student
        student = User(
            email="student@test.com",
            hashed_password=get_password_hash("student123"),
            full_name="Алексей Учеников",
            role=Role.STUDENT,
            is_active=True,
            balance=7500 # 7,500 Rubles initial balance
        )
        session.add(student)

        # 3. Create Parent 1
        parent = User(
            email="parent@test.com",
            hashed_password=get_password_hash("parent123"),
            full_name="Мария Родителева",
            role=Role.PARENT,
            is_active=True,
            balance=0
        )
        parent.children.append(student)
        session.add(parent)

        # 3.1 Create Extra Students and Parent 2 for testing
        student2 = User(
            email="student2@test.com",
            hashed_password=get_password_hash("student123"),
            full_name="Дмитрий Учеников",
            role=Role.STUDENT,
            is_active=True,
            balance=5000
        )
        student3 = User(
            email="student3@test.com",
            hashed_password=get_password_hash("student123"),
            full_name="Елена Ученикова",
            role=Role.STUDENT,
            is_active=True,
            balance=3000
        )
        parent2 = User(
            email="parent2@test.com",
            hashed_password=get_password_hash("parent123"),
            full_name="Олег Родителев",
            role=Role.PARENT,
            is_active=True,
            balance=0
        )
        parent2.children.extend([student2, student3])
        session.add_all([student2, student3, parent2])

        # Flush to generate IDs
        await session.flush()

        # 4. Create Lessons
        # 4.1 Completed Lesson (Yesterday)
        completed_start = datetime.now(timezone.utc) - timedelta(days=1)
        # Round minutes to nice values
        completed_start = completed_start.replace(hour=14, minute=0, second=0, microsecond=0)
        completed_end = completed_start + timedelta(hours=1, minutes=30)
        
        completed_lesson = Lesson(
            tutor_id=tutor.id,
            student_id=student.id,
            title="Занятие по Python (Вводный урок)",
            start_time=completed_start,
            end_time=completed_end,
            status=LessonStatus.COMPLETED,
            price=1500
        )
        session.add(completed_lesson)

        # 4.2 Scheduled Lesson (Tomorrow)
        scheduled_start = datetime.now(timezone.utc) + timedelta(days=1)
        scheduled_start = scheduled_start.replace(hour=15, minute=0, second=0, microsecond=0)
        scheduled_end = scheduled_start + timedelta(hours=1, minutes=30)

        scheduled_lesson = Lesson(
            tutor_id=tutor.id,
            student_id=student.id,
            title="Занятие по Python (Списки и Циклы)",
            start_time=scheduled_start,
            end_time=scheduled_end,
            status=LessonStatus.SCHEDULED,
            price=1500
        )
        session.add(scheduled_lesson)

        # 4.3 Open slots (Next few days)
        slot1_start = datetime.now(timezone.utc) + timedelta(days=2)
        slot1_start = slot1_start.replace(hour=16, minute=0, second=0, microsecond=0)
        slot1_end = slot1_start + timedelta(hours=1, minutes=30)
        slot1 = Lesson(
            tutor_id=tutor.id,
            student_id=None,
            title="Занятие по информатике",
            start_time=slot1_start,
            end_time=slot1_end,
            status=LessonStatus.OPEN,
            price=1500
        )
        session.add(slot1)

        slot2_start = datetime.now(timezone.utc) + timedelta(days=3)
        slot2_start = slot2_start.replace(hour=12, minute=0, second=0, microsecond=0)
        slot2_end = slot2_start + timedelta(hours=1, minutes=30)
        slot2 = Lesson(
            tutor_id=tutor.id,
            student_id=None,
            title="Занятие по алгоритмам",
            start_time=slot2_start,
            end_time=slot2_end,
            status=LessonStatus.OPEN,
            price=1800
        )
        session.add(slot2)

        # Flush to generate scheduled lesson ID
        await session.flush()

        # 5. Create Homework for Tomorrow's Lesson
        homework = Homework(
            lesson_id=scheduled_lesson.id,
            description="Напишите программу на Python, которая принимает целое положительное число N и вычисляет сумму всех четных чисел от 1 до N включительно. Например, если N=6, сумма должна быть 2 + 4 + 6 = 12.",
            due_date=datetime.now(timezone.utc) + timedelta(days=3),
            status=HomeworkStatus.PENDING
        )
        session.add(homework)

        await session.commit()
        print("SUCCESS: Database successfully seeded!")
        print("Tutor:    email=tutor@test.com, password=tutor123")
        print("Student:  email=student@test.com, password=student123 (Balance: 7500 руб.)")
        print("Parent:   email=parent@test.com, password=parent123")

if __name__ == "__main__":
    asyncio.run(seed_data())
