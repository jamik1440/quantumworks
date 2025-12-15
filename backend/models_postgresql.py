"""
PostgreSQL-optimized models for QuantumWorks
This replaces models.py after migration
"""
from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, DateTime, 
    Text, Numeric, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="freelancer")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    projects = relationship("Project", back_populates="author", cascade="all, delete-orphan")
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sent_messages = relationship("ChatMessage", foreign_keys="ChatMessage.sender_id", back_populates="sender")
    received_messages = relationship("ChatMessage", foreign_keys="ChatMessage.receiver_id", back_populates="receiver")
    tasks = relationship("Task", foreign_keys="Task.freelancer_id", back_populates="freelancer")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    skills = Column(ARRAY(String), default=[], server_default="{}")
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    location = Column(String(255), nullable=True)
    website = Column(String(500), nullable=True)
    social_links = Column(JSONB, default={}, server_default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    budget_min = Column(Numeric(10, 2), nullable=True)
    budget_max = Column(Numeric(10, 2), nullable=True)
    skills = Column(ARRAY(String), default=[], server_default="{}")
    category = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint('budget_max >= budget_min', name='budget_check'),
    )
    
    # Relationships
    author = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    freelancer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="open", index=True)
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    price = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')",
            name='valid_status'
        ),
    )
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    freelancer = relationship("User", foreign_keys=[freelancer_id], back_populates="tasks")
    reviews = relationship("Review", back_populates="task", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('task_id', 'reviewer_id', name='unique_task_reviewer'),
        CheckConstraint('rating >= 1 AND rating <= 5', name='rating_check'),
        CheckConstraint('reviewer_id != reviewee_id', name='reviewer_not_reviewee'),
    )
    
    # Relationships
    task = relationship("Task", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="text", server_default="text")
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint('sender_id != receiver_id', name='sender_not_receiver'),
    )
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

# Token tables (from security audit)
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    revoked = Column(Boolean, nullable=False, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    token_jti = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    blacklisted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

