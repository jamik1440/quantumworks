from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "freelancer"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: Optional[Dict[str, Any]] = None

class TokenData(BaseModel):
    email: Optional[str] = None

# --- PROPOSAL SCHEMAS ---
class ProposalBase(BaseModel):
    cover_letter: str
    price_quote: float
    estimated_days: int

class ProposalCreate(ProposalBase):
    project_id: int

class Proposal(ProposalBase):
    id: int
    project_id: int
    freelancer_id: int
    status: str
    created_at: datetime
    freelancer: Optional[UserInDB] = None

    class Config:
        from_attributes = True

# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    title: str
    description: str
    budget: str
    skills: str 
    category: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    author_id: int
    status: str
    created_at: datetime
    author_name: Optional[str] = None
    
    # Optional nested proposal data
    proposals: List[Proposal] = []

    class Config:
        from_attributes = True

class ProjectStatusUpdate(BaseModel):
    status: str

# --- CONTRACT SCHEMAS ---
class ContractBase(BaseModel):
    amount: float
    end_date: Optional[datetime] = None

class ContractCreate(ContractBase):
    project_id: int
    proposal_id: int
    freelancer_id: int

class Contract(ContractBase):
    id: int
    project_id: int
    client_id: int
    freelancer_id: int
    proposal_id: int
    status: str
    start_date: datetime
    is_funded: bool
    escrow_balance: float

    class Config:
        from_attributes = True

# --- AI TASK ASSISTANT SCHEMAS ---
class TaskParseRequest(BaseModel):
    user_input: str
    budget: Optional[str] = None
    deadline: Optional[str] = None

class TaskParseResponse(BaseModel):
    extracted_data: Dict[str, Any]
    budget_estimate: Dict[str, Any]
    timeline_estimate: Dict[str, Any]
    missing_information: List[Dict[str, Any]]
    confidence_score: float
    needs_clarification: bool

class FollowUpQuestionsRequest(BaseModel):
    extracted_data: Dict[str, Any]
    missing_info: List[Dict[str, Any]]

class FollowUpQuestionsResponse(BaseModel):
    questions: List[Dict[str, Any]]
    context_summary: str
    next_steps: str

class BudgetDeadlineRequest(BaseModel):
    title: str
    description: str
    category: str
    skills: List[str]
    scope: str
    complexity: str

class BudgetDeadlineResponse(BaseModel):
    budget_suggestion: Dict[str, Any]
    deadline_suggestion: Dict[str, Any]
    recommendations: List[str]

class FinalGenerateRequest(BaseModel):
    complete_data: Dict[str, Any]
    user_input: str
    budget: Optional[str] = None
    deadline: Optional[str] = None

class FinalGenerateResponse(BaseModel):
    title: str
    description: str
    category: str
    skills: str
    budget: str
    status: str
    metadata: Dict[str, Any]