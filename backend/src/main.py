from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

load_dotenv()

from src.auth.router import router as auth_router
from src.users.router import router as users_router
from src.lessons.router import router as lessons_router
from src.homeworks.router import router as homeworks_router
from src.room.router import router as room_router
from src.ws.router import router as ws_router
from src.chat.router import router as chat_router
from src.files.router import router as files_router

app = FastAPI(
    title="TutorOnline API",
    description="API for TutorOnline Platform",
    version="1.0.0",
)

# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
# app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# CORS configuration
# Using CORS_ORIGINS strictly from environment
cors_origins = os.getenv("CORS_ORIGINS")
if not cors_origins:
    raise RuntimeError("CORS_ORIGINS environment variable is required")
origins_list = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
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
app.include_router(files_router)
