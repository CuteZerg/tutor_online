from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from src.auth.router import router as auth_router
from src.users.router import router as users_router
from src.lessons.router import router as lessons_router
from src.homeworks.router import router as homeworks_router
from src.room.router import router as room_router
from src.ws.router import router as ws_router
from src.chat.router import router as chat_router

app = FastAPI(
    title="TutorOnline API",
    description="API for TutorOnline Platform",
    version="1.0.0",
)

# Setup static files for uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(lessons_router)
app.include_router(homeworks_router)
app.include_router(room_router)
app.include_router(ws_router)
app.include_router(chat_router)
