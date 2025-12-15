from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum

class ProposalStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class ContractStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(String, default="freelancer")  # admin, freelancer, employer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    projects = relationship("Project", back_populates="author")
    proposals = relationship("Proposal", back_populates="freelancer")
    contracts_as_client = relationship("Contract", foreign_keys="[Contract.client_id]", back_populates="client")
    contracts_as_freelancer = relationship("Contract", foreign_keys="[Contract.freelancer_id]", back_populates="freelancer")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text)
    budget = Column(String)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    deadline = Column(DateTime, nullable=True)
    skills = Column(String)  # Comma-separated or JSON
    category = Column(String)
    status = Column(String, default="active")  # active, in_progress, completed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    author = relationship("User", back_populates="projects")
    proposals = relationship("Proposal", back_populates="project")
    contract = relationship("Contract", back_populates="project", uselist=False)

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    freelancer_id = Column(Integer, ForeignKey("users.id"))
    cover_letter = Column(Text)
    price_quote = Column(Float)
    estimated_days = Column(Integer)
    status = Column(String, default=ProposalStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="proposals")
    freelancer = relationship("User", back_populates="proposals")

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    client_id = Column(Integer, ForeignKey("users.id"))
    freelancer_id = Column(Integer, ForeignKey("users.id"))
    proposal_id = Column(Integer, ForeignKey("proposals.id"))
    
    amount = Column(Float)
    status = Column(String, default=ContractStatus.ACTIVE)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Escrow details (simplified for MVP)
    is_funded = Column(Boolean, default=False)
    escrow_balance = Column(Float, default=0.0)
    
    project = relationship("Project", back_populates="contract")
    proposal = relationship("Proposal")
    client = relationship("User", foreign_keys=[client_id], back_populates="contracts_as_client")
    freelancer = relationship("User", foreign_keys=[freelancer_id], back_populates="contracts_as_freelancer")
