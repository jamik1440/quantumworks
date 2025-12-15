from fastapi import FastAPI, Depends, HTTPException, status, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import time
import uuid
import os
from backend import models, schemas, auth, database


# Import middlewarre
from backend.middleware import (
    rate_limiter,
    login_rate_limit,
    register_rate_limit,
    ai_rate_limit,
    admin_rate_limit,
    brute_force_protection,
    check_brute_force,
    ai_protection,
    ai_quota_check,
    get_operation_cost,
    security_monitor,
    SecurityEventType,
    SecurityEventSeverity,
    log_failed_login,
    log_successful_login,
    log_admin_action,
    log_unauthorized_access
)

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="QuantumWorks API",
    description="Secure marketplace API with AI-powered features",
    version="2.0.0"
)

# Startup event
@app.on_event("startup")
async def startup_event():
    rate_limiter.start_cleanup_task()
    await create_admin_user()

async def create_admin_user():
    db = database.SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        
        if admin_email and admin_password:
            admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
            if not admin_user:
                hashed_password = auth.get_password_hash(admin_password)
                admin_user = models.User(
                    email=admin_email,
                    hashed_password=hashed_password,
                    full_name="Admin",
                    role="admin",
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
                print(f"✓ Admin user created: {admin_email}")
    except Exception as e:
        print(f"✗ Error initializing admin: {e}")
    finally:
        db.close()

# CORS
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000"
).split(",")

# Ensure local dev ports are always allowed even if env overrides
for origin in [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://quantumworks.onrender.com",
    "https://quantumworks-backend.onrender.com",
]:
    if origin not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(origin)

# Dev fallback: if list empty, allow all to avoid CORS blocking local runs
if not ALLOWED_ORIGINS or ALLOWED_ORIGINS == ['']:
    ALLOWED_ORIGINS = ["*"]

print(f"[CORS] Allowing origins: {ALLOWED_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Visitor tracking
active_visitors: Dict[str, float] = {}
VISITOR_TIMEOUT = 300

@app.middleware("http")
async def track_visitors(request: Request, call_next):
    visitor_id = request.cookies.get("visitor_id")
    if not visitor_id:
        visitor_id = str(uuid.uuid4())
    active_visitors[visitor_id] = time.time()
    response = await call_next(request)
    if not request.cookies.get("visitor_id"):
        response.set_cookie(
            key="visitor_id",
            value=visitor_id,
            max_age=86400 * 365,
            httponly=True,
            secure=os.getenv("ENVIRONMENT") == "production",
            samesite="lax"
        )
    return response

# ============================================
# MONITORING MIDDLEWARE
# ============================================

@app.middleware("http")
async def monitor_performance(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log slow requests (> 1s)
    if process_time > 1.0:
        print(f"⚠️ SLOW REQUEST: {request.method} {request.url} took {process_time:.2f}s")
        
    # Add header for debugging
    response.headers["X-Process-Time"] = str(process_time)
    return response

# ============================================
# AUTH
# ============================================

@app.post("/auth/register", response_model=schemas.UserInDB)
async def register(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    _: None = Depends(register_rate_limit)
):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    security_monitor.log_security_event(
        event_type=SecurityEventType.ACCOUNT_CREATED,
        severity=SecurityEventSeverity.LOW,
        user_id=db_user.id,
        ip_address=request.client.host
    )
    return db_user

@app.post("/auth/login", response_model=schemas.Token)
async def login(
    user_credentials: schemas.UserLogin,
    request: Request,
    db: Session = Depends(database.get_db),
    _: None = Depends(login_rate_limit)
):
    client_ip = request.client.host
    check_brute_force(user_credentials.email, client_ip)
    
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        is_blocked = brute_force_protection.record_failed_login(user_credentials.email, client_ip)
        log_failed_login(user_credentials.email, client_ip)
        if is_blocked:
            raise HTTPException(status_code=403, detail="Account locked")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account currently inactive")
    
    brute_force_protection.clear_failed_attempts(user_credentials.email, client_ip)
    log_successful_login(user.id, user.email, client_ip)
    
    access_token = auth.create_access_token(data={"sub": user.email})
    refresh_token = auth.create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

from fastapi import Body
@app.post("/auth/refresh", response_model=schemas.Token)
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(database.get_db)
):
    payload = auth.verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
         raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    email = payload.get("sub")
    if not email:
         raise HTTPException(status_code=401, detail="Invalid token subject")
         
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.is_active:
         raise HTTPException(status_code=401, detail="User not found or inactive")
         
    new_access_token = auth.create_access_token(data={"sub": user.email})
    # Rotate refresh token
    new_refresh_token = auth.create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }


@app.get("/users/me", response_model=schemas.UserInDB)
async def get_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# ============================================
# PROJECTS
# ============================================

@app.post("/projects/", response_model=schemas.Project)
async def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "employer" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only employers can create projects")
        
    try:
        # Explicit mapping to avoid extra fields issue
        db_project = models.Project(
            title=project.title,
            description=project.description,
            budget=project.budget,
            skills=project.skills,
            category=project.category,
            budget_min=project.budget_min,
            budget_max=project.budget_max,
            deadline=project.deadline,
            author_id=current_user.id
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        # Set transient attribute for schema
        db_project.author_name = current_user.full_name
        return db_project
    except Exception as e:
        import traceback
        print(f"ERROR CREATING PROJECT: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/", response_model=List[schemas.Project])
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Project).filter(models.Project.status == "active")
    if category:
        query = query.filter(models.Project.category == category)
    
    projects = query.offset(skip).limit(limit).all()
    for p in projects:
        p.author_name = p.author.full_name if p.author else "Unknown"
    return projects

@app.get("/projects/{project_id}", response_model=schemas.Project)
async def read_project(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user_from_header)  # Correct function
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.author_name = project.author.full_name if project.author else "Unknown"
    
    # Only show proposals to the author or admin
    if not current_user or (current_user.id != project.author_id and current_user.role != "admin"):
        project.proposals = []
        
    return project

# ============================================
# PROPOSALS (New!)
# ============================================

@app.post("/projects/{project_id}/proposals", response_model=schemas.Proposal)
async def create_proposal(
    project_id: int,
    proposal: schemas.ProposalCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can submit proposals")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or project.status != "active":
        raise HTTPException(status_code=404, detail="Project not found or not active")
        
    if project.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot bid on your own project")

    # Check if already submitted
    existing = db.query(models.Proposal).filter(
        models.Proposal.project_id == project_id,
        models.Proposal.freelancer_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a proposal")

    db_proposal = models.Proposal(
        **proposal.model_dump(exclude={'project_id'}),
        project_id=project_id,
        freelancer_id=current_user.id
    )
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    return db_proposal

@app.get("/my-proposals", response_model=List[schemas.Proposal])
async def get_my_proposals(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    proposals = db.query(models.Proposal).filter(
        models.Proposal.freelancer_id == current_user.id
    ).all()
    return proposals

# ============================================
# CONTRACTS (New!)
# ============================================

@app.post("/proposals/{proposal_id}/accept", response_model=schemas.Contract)
async def accept_proposal(
    proposal_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Client accepts a proposal -> Creates a Contract"""
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    project = proposal.project
    if project.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this proposal")
        
    if project.status != "active":
        raise HTTPException(status_code=400, detail="Project is not active")

    # update proposal status
    proposal.status = models.ProposalStatus.ACCEPTED
    
    # create contract
    contract = models.Contract(
        project_id=project.id,
        client_id=current_user.id,
        freelancer_id=proposal.freelancer_id,
        proposal_id=proposal.id,
        amount=proposal.price_quote,
        status=models.ContractStatus.ACTIVE,
        is_funded=False # In real app, redirect to payment here
    )
    
    # update project status
    project.status = "in_progress"
    
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract

@app.get("/my-contracts", response_model=List[schemas.Contract])
async def get_my_contracts(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    contracts = db.query(models.Contract).filter(
        (models.Contract.client_id == current_user.id) | 
        (models.Contract.freelancer_id == current_user.id)
    ).all()
    return contracts

# ============================================
# AI ENDPOINTS
# ============================================
# (Kept secure with quota)

@app.post("/ai/task/parse", response_model=schemas.TaskParseResponse)
async def parse_task_input(
    request_data: schemas.TaskParseRequest,
    current_user: models.User = Depends(ai_quota_check)
):
    from backend.services.task_assistant_service import get_task_assistant_service
    try:
        assistant = get_task_assistant_service()
        result = await assistant.parse_user_input(
            user_input=request_data.user_input,
            budget=request_data.budget,
            deadline=request_data.deadline
        )
        ai_protection.record_ai_usage(current_user.id, "task_parse", 0.01)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/projects/{project_id}/matches")
async def get_project_matches(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(ai_quota_check)
):
    # Only author/admin
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project: 
        raise HTTPException(status_code=404, detail="Not found")
    if project.author_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Unauthorized")

    from backend.services.matching_service import get_matching_service
    try:
        service = get_matching_service(db)
        matches = await service.match_freelancers_to_project(project_id, limit=5)
        ai_protection.record_ai_usage(current_user.id, "match_freelancers", 0.05)
        return {"matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ADMIN
# ============================================
# ... existing secure admin endpoints ...

# ============================================
# WEBSOCKET CHAT (Fixed & Added)
# ============================================

from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        # contract_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        print(f"WS Connected: {room_id}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)

    async def broadcast(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            # Clean dead connections
            active = []
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                    active.append(connection)
                except:
                    pass
            self.active_connections[room_id] = active

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def personal_websocket_endpoint(
    websocket: WebSocket, 
    user_id: int, 
    token: str = Query(None)
):
    # If token not in query, try finding it in headers (WS handshake headers)
    # But usually standard WS client in JS doesn't support headers easily, query is best.
    if not token:
         await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
         return

    payload = auth.verify_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    email = payload.get("sub")
    if not email:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify user matches token (optional, but good)
    # or just trust the token and ignore the path param 'user_id' (safer)
    # We'll use the token's user.
    
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user or user.id != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    finally:
        db.close()

    # Room ID for personal notifications/messages
    room_id = f"user_{user_id}" 
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming personal messages
            # { "type": "personal_message", "recipient_id": "...", "content": "..." }
            try:
                import json
                msg_data = json.loads(data)
                
                if msg_data.get("type") == "personal_message":
                    recipient_id = msg_data.get("recipient_id")
                    content = msg_data.get("content")
                    
                    # Send to recipient
                    target_room = f"user_{recipient_id}"
                    
                    # Construct message payload
                    out_msg = {
                        "type": "new_message",
                        "sender_id": str(user_id),
                        "content": content,
                        "timestamp": str(datetime.now())
                    }
                    
                    await manager.broadcast(out_msg, target_room)
                    
            except Exception as e:
                print(f"Error processing WS message: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

@app.websocket("/ws/chat/{contract_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    contract_id: int, 
    token: str = Query(...)
):
    # Verify Token
    payload = auth.verify_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    email = payload.get("sub")
    if not email:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Fetch User
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = user.id
    finally:
        db.close()
    
    room_id = str(contract_id)
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            # In a real app, save message to DB here
            message = {
                "sender_id": user_id,
                "text": data,
                "timestamp": str(datetime.now())
            }
            await manager.broadcast(message, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

# ============================================
# RUNNER
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
# ============================================
# STATS
# ============================================

@app.get("/stats/active-visitors")
async def get_active_visitors():
    """
    Returns number of active visitors in last 5 minutes
    """
    now = time.time()
    # cleanup expired visitors
    expired = [
        vid for vid, ts in active_visitors.items()
        if now - ts > VISITOR_TIMEOUT
    ]
    for vid in expired:
        del active_visitors[vid]

    return {
        "activeVisitors": len(active_visitors)
    }
