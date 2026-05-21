# TutorOnline

TutorOnline is a comprehensive platform for online education connecting tutors, students, and parents. It offers an integrated environment with a custom video-calling room, interactive Python code execution, collaborative whiteboard, and real-time messaging.

## Key Features

- **Role-based Dashboards:** Dedicated interfaces for Tutors, Students, and Parents.
- **Real-time Chat:** Instant messaging with image attachments and a built-in Python code editor (Monaco Editor) that runs code remotely.
- **Virtual Classroom:** LiveKit-powered video and audio calls with screen sharing.
- **Interactive Whiteboard:** Collaborative drawing canvas during lessons.
- **Scheduling System:** Calendar integration for booking, approving, and managing lessons.
- **Homework & Finance Management:** Automated tracking of assignments and virtual balances.

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Zustand, LiveKit Components.
- **Backend:** FastAPI, Python, SQLAlchemy (asyncpg), PostgreSQL.
- **Real-time:** WebSockets (FastAPI), LiveKit Cloud.
- **Containerization:** Docker & Docker Compose.

## Running Locally

### Backend Setup
1. `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Start DB via docker: `docker-compose up -d db` (from project root)
6. Run migrations: `alembic upgrade head`
7. Seed the database: `python seed.py`
8. Start the server: `uvicorn src.main:app --reload --host 127.0.0.1 --port 8000`

### Frontend Setup
1. `cd frontend`
2. Install dependencies: `npm install`
3. Set `.env.local` variables (e.g. `NEXT_PUBLIC_LIVEKIT_URL`)
4. Start the server: `npm run dev`

## Deployment

The platform is fully containerized. You can build the production images using the provided `Dockerfile`s in `frontend` and `backend` directories.

```bash
# Build backend
docker build -t tutoronline-backend ./backend

# Build frontend
docker build -t tutoronline-frontend ./frontend
```
