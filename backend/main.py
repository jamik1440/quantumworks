from fastapi import FastAPI, Depends, HTTPException, status, Request, Query, Body, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime
import time
import uuid
import os

from backend import models, schemas, auth, database
from backend.middleware import (
    rate_limiter,
    login_rate_limit,
    register_rate_limit,
    brute_force_protection,
    check_brute_force,
    ai_protection,
    ai_quota_check,
    security_monitor,
    SecurityEventType,
    SecurityEventSeverity,
    log_failed_login,
    log_successful_login,
)

# ======================================================
# APP
# ======================================================

app = FastAPI(
    title="QuantumWorks API",
    description="Secure marketplace API",
    version="2.0.0"
)

# ======================================================
# STARTUP
# ======================================================

@app.on_event("startup")
async def startup_event():
    # DB tables
    models.Base.metadata.create_all(bind=database.engine)

    # rate limiter cleanup
    rate_limiter.start_cleanup_task()

    # create admin
    await create_admin_user()


async def create_admin_user():
    db = database.SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if admin_email and admin_password:
            exists = db.query(models.User).filter(models.User.email == admin_email).first()
            if not exists:
                user = models.User(
                    email=admin_email,
                    hashed_password=auth.get_password_hash(admin_password),
                    full_name="Admin",
                    role="admin",
                    is_active=True
                )
                db.add(user)
                db.commit()
                print("✓ Admin user created")
    finally:
        db.close()

# ======================================================
# CORS
# ======================================================

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,https://quantumworks.onrender.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[CORS] {ALLOWED_ORIGINS}")

# ======================================================
# ROOT (health check)
# ======================================================

@app.get("/")
def root():
    return {"status": "QuantumWorks API is running"}

# ======================================================
# VISITOR TRACKING
# ======================================================

active_visitors: Dict[str, float] = {}
VISITOR_TIMEOUT = 300

@app.middleware("http")
async def track_visitors(request: Request, call_next):
    visitor_id = request.cookies.get("visitor_id") or str(uuid.uuid4())
    active_visitors[visitor_id] = time.time()

    response = await call_next(request)

    response.set_cookie(
        key="visitor_id",
        value=visitor_id,
        max_age=86400 * 365,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return response

# ======================================================
# AUTH
# ======================================================

@app.post("/auth/register", response_model=schemas.UserInDB)
async def register(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    _: None = Depends(register_rate_limit)
):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(400, "Email already registered")

    db_user = models.User(
        email=user.email,
        hashed_password=auth.get_password_hash(user.password),
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    security_monitor.log_security_event(
        SecurityEventType.ACCOUNT_CREATED,
        SecurityEventSeverity.LOW,
        db_user.id,
        request.client.host
    )

    return db_user


@app.post("/auth/login", response_model=schemas.Token)
async def login(
    creds: schemas.UserLogin,
    request: Request,
    db: Session = Depends(database.get_db),
    _: None = Depends(login_rate_limit)
):
    ip = request.client.host
    check_brute_force(creds.email, ip)

    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user or not auth.verify_password(creds.password, user.hashed_password):
        brute_force_protection.record_failed_login(creds.email, ip)
        log_failed_login(creds.email, ip)
        raise HTTPException(401, "Invalid credentials")

    log_successful_login(user.id, user.email, ip)

    return {
        "access_token": auth.create_access_token({"sub": user.email}),
        "refresh_token": auth.create_refresh_token({"sub": user.email}),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }


@app.post("/auth/refresh", response_model=schemas.Token)
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(database.get_db)
):
    payload = auth.verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")

    user = db.query(models.User).filter(models.User.email == payload["sub"]).first()
    if not user:
        raise HTTPException(401, "User not found")

    return {
        "access_token": auth.create_access_token({"sub": user.email}),
        "refresh_token": auth.create_refresh_token({"sub": user.email}),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

# ======================================================
# PROJECTS
# ======================================================

@app.get("/projects/", response_model=List[schemas.Project])
async def read_projects(db: Session = Depends(database.get_db)):
    projects = db.query(models.Project).filter(models.Project.status == "active").all()
    for p in projects:
        p.author_name = p.author.full_name if p.author else "Unknown"
    return projects

# ======================================================
# STATS
# ======================================================

@app.get("/stats/active-visitors")
async def get_active_visitors():
    now = time.time()
    expired = [k for k, v in active_visitors.items() if now - v > VISITOR_TIMEOUT]
    for k in expired:
        del active_visitors[k]
    return {"activeVisitors": len(active_visitors)}

# ======================================================
# WEBSOCKET (SAFE)
# ======================================================

class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, room: str):
        await ws.accept()
        self.rooms.setdefault(room, []).append(ws)

    def disconnect(self, ws: WebSocket, room: str):
        if room in self.rooms:
            if ws in self.rooms[room]:
                self.rooms[room].remove(ws)
            if not self.rooms[room]:
                del self.rooms[room]

    async def broadcast(self, room: str, message: dict):
        for ws in self.rooms.get(room, []):
            await ws.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_user(ws: WebSocket, user_id: int, token: str = Query(...)):
    payload = auth.verify_token(token)
    if not payload:
        await ws.close()
        return

    room = f"user_{user_id}"
    await manager.connect(ws, room)

    try:
        while True:
            msg = await ws.receive_text()
            await manager.broadcast(room, {
                "sender": user_id,
                "text": msg,
                "time": str(datetime.utcnow())
            })
    except WebSocketDisconnect:
        manager.disconnect(ws, room)
