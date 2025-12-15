from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from . import schemas, models, database

# Get SECRET_KEY from environment variable
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "SECRET_KEY environment variable must be set! "
        "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Use pbkdf2_sha256 (secure and reliable across all platforms)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password for storing"""
    # Ensure password is string
    password_str = str(password)
    
    # Pbkdf2 handles long passwords better than bcrypt
    # but we still limit to reasonable length
    if len(password_str) > 128:
        password_str = password_str[:128]
    
    return pwd_context.hash(password_str)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),  # Issued at
        "type": "access"  # Token type
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
) -> models.User:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise credentials_exception
        
        # Check token type
        if payload.get("type") != "access":
            raise credentials_exception
        
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise credentials_exception
    
    # Get user from database
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    
    if user is None:
        raise credentials_exception
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user

async def get_current_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Dependency to ensure current user is an admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. Insufficient permissions."
        )
    return current_user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Get current active user (additional check)"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme)
    # Note: oauth2_scheme raises 401 if no token. 
    # For truly optional, we need to inspect the header manually or make token optional in a wrapper.
) -> Optional[models.User]:
    """Get user if token helps, otherwise None. Currently oauth2_scheme enforces token presence."""
    # To implement truly optional auth, we modify this:
    return None

# Replacing with a working manual header check for optional auth
from fastapi import Header

async def get_optional_user_from_header(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(database.get_db)
) -> Optional[models.User]:
    if not authorization:
        return None
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            return None
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except Exception:
        return None

def verify_token(token: str) -> Optional[dict]:
    """Verify a JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None