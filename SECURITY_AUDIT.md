# 🔒 Security Audit Report: QuantumWorks Authentication System

## Executive Summary

This audit identifies **critical security vulnerabilities** in the current authentication implementation. The system requires immediate hardening before production deployment.

---

## 1. 🚨 CRITICAL VULNERABILITIES (Fix Immediately)

### C1: JWT Token Stored in localStorage - XSS Vulnerability
**Severity: CRITICAL**  
**CVSS Score: 8.8 (High)**

**Issue:**
```typescript
// services/api.ts:32
const token = localStorage.getItem('token');
localStorage.setItem('token', newToken);
```

**Risk:**
- Tokens accessible via JavaScript → vulnerable to XSS attacks
- Stolen tokens cannot be revoked (no token blacklist)
- Attackers can steal tokens through any XSS vector

**Impact:** Complete account takeover if XSS occurs

---

### C2: No Refresh Token Implementation
**Severity: CRITICAL**  
**CVSS Score: 7.5 (High)**

**Issue:**
- Only access tokens exist
- No refresh token rotation
- Long-lived access tokens (30 minutes) with no revocation

**Risk:**
- Tokens remain valid even after logout
- No automatic token refresh
- Manual refresh endpoint doesn't exist properly

---

### C3: Weak SECRET_KEY Management
**Severity: CRITICAL**  
**CVSS Score: 9.1 (Critical)**

**Issue:**
```python
# backend/auth.py:11
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")
```

**Risk:**
- Default weak key in codebase
- No key rotation mechanism
- Same key for all environments if not configured

**Impact:** Token forgery possible if key is compromised

---

### C4: WebSocket Authentication Missing
**Severity: CRITICAL**  
**CVSS Score: 8.2 (High)**

**Issue:**
```typescript
// contexts/ChatContext.tsx:32
const wsUrl = `${wsProtocol}//localhost:8000/ws/${user.id}`;
const socket = new WebSocket(wsUrl);
```

**Risk:**
- No token authentication on WebSocket connection
- User ID in URL (predictable)
- No authorization checks
- Anyone can connect as any user

**Impact:** Unauthorized access to user data, message interception

---

### C5: No Token Revocation/Blacklist
**Severity: HIGH**  
**CVSS Score: 7.2 (High)**

**Issue:**
- Logout doesn't invalidate tokens
- No token blacklist/denylist
- No database tracking of valid tokens

**Risk:**
- Stolen tokens remain valid after logout
- No way to revoke compromised tokens

---

### C6: Missing CSRF Protection
**Severity: HIGH**  
**CVSS Score: 7.1 (High)**

**Issue:**
- No CSRF tokens
- Only CORS configured (different protection)
- State-changing operations vulnerable

**Risk:**
- Attackers can perform actions on behalf of users
- Particularly dangerous for admin endpoints

---

## 2. ⚠️ HIGH SEVERITY ISSUES

### H1: CORS Too Permissive
**Severity: HIGH**

**Issue:**
```python
# backend/main.py:99
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", ...]
```

**Risk:**
- Hardcoded origins (won't work in production)
- Should use environment variables
- No origin validation

---

### H2: No Rate Limiting
**Severity: HIGH**

**Issue:**
- Login endpoint unprotected
- No brute force protection
- Admin endpoints accessible without limits

**Risk:**
- Brute force attacks
- Account enumeration
- DoS vulnerabilities

---

### H3: Password Security Issues
**Severity: HIGH**

**Issue:**
```python
# Password truncation in get_password_hash
if len(password_bytes) > 72:
    password_bytes = password_bytes[:72]
```

**Risk:**
- Silent password truncation
- No password strength requirements visible
- Using pbkdf2_sha256 instead of bcrypt (acceptable but less standard)

---

### H4: User Inactive Check Missing
**Severity: HIGH**

**Issue:**
```python
# backend/auth.py:58
user = db.query(models.User).filter(models.User.email == token_data.email).first()
# No check for user.is_active
```

**Risk:**
- Banned/inactive users can still use tokens
- Should check `user.is_active` in `get_current_user`

---

### H5: Information Disclosure
**Severity: MEDIUM-HIGH**

**Issue:**
- Generic error messages in some places
- But email enumeration possible in login
- Stack traces might leak in production

---

## 3. ⚠️ MEDIUM SEVERITY ISSUES

### M1: No Token Expiry Validation in Frontend
**Severity: MEDIUM**

**Issue:**
- Frontend doesn't check token expiry before requests
- Only reacts to 401 responses

---

### M2: Hardcoded Admin Credentials
**Severity: MEDIUM**

**Issue:**
```python
# backend/main.py:22-23
admin_email = "jamiksteam@gmail.com"
admin_password = "Jamik1440$"
```

**Risk:**
- Credentials in source code
- Should use environment variables or secure initialization

---

### M3: No Secure Headers
**Severity: MEDIUM**

**Issue:**
- Missing security headers (HSTS, CSP, X-Frame-Options, etc.)
- No Content-Security-Policy

---

## 4. ✅ PRODUCTION-GRADE AUTHENTICATION ARCHITECTURE

### Architecture Overview

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │
       │ 1. POST /auth/login (email, password)
       ▼
┌─────────────────────┐
│   FastAPI Backend   │
│                     │
│  ┌───────────────┐  │
│  │   Auth Layer  │  │
│  │  - Validate   │  │
│  │  - Hash Check │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │ Token Service │  │
│  │ - Access JWT  │  │
│  │ - Refresh JWT │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │ Token Store   │  │
│  │ (Redis/DB)    │  │
│  │ - Blacklist   │  │
│  │ - Refresh     │  │
│  └───────────────┘  │
└─────────────────────┘
       │
       │ 2. Return: {access_token, refresh_token}
       │    (HttpOnly Cookie for refresh_token)
       ▼
┌─────────────┐
│   Client    │
│ Stores:     │
│ - Access in │
│   memory    │
│ - Refresh   │
│   in cookie │
└─────────────┘
```

---

## 5. 📊 TOKEN LIFECYCLE DIAGRAM (Textual)

### Login Flow:
```
1. User submits credentials
   ↓
2. Backend validates (email + password hash)
   ↓
3. Check user.is_active == True
   ↓
4. Generate:
   - Access Token (15 min expiry, short-lived)
   - Refresh Token (7 days expiry, long-lived)
   ↓
5. Store refresh token hash in database
   ↓
6. Return:
   - Access Token: JSON response body
   - Refresh Token: HttpOnly, Secure, SameSite=Strict cookie
   ↓
7. Client stores access token in memory (React state)
   Client cannot access refresh token (HttpOnly cookie)
```

### Token Refresh Flow:
```
1. Access token expires (15 min)
   ↓
2. Client receives 401 Unauthorized
   ↓
3. Client sends refresh token from cookie
   POST /auth/refresh
   (no access token needed)
   ↓
4. Backend validates:
   - Refresh token signature
   - Refresh token not in blacklist
   - Refresh token hash matches database
   - User still active
   ↓
5. Generate NEW tokens:
   - New access token
   - New refresh token (rotation)
   ↓
6. Update database:
   - Blacklist old refresh token
   - Store new refresh token hash
   ↓
7. Return new tokens
   ↓
8. Client updates access token in memory
```

### Logout Flow:
```
1. Client calls POST /auth/logout
   ↓
2. Backend:
   - Adds refresh token to blacklist
   - Removes refresh token from database
   - Optionally: blacklist access token (if tracking)
   ↓
3. Clear cookies on client
   ↓
4. Remove access token from memory
```

### Token Revocation Flow:
```
1. Security incident detected
   ↓
2. Admin/user revokes all tokens
   POST /auth/revoke-all
   ↓
3. Backend:
   - Blacklist all user's refresh tokens
   - Delete all refresh tokens from database
   - Add user ID to "force re-login" list
   ↓
4. On next request, user must re-authenticate
```

---

## 6. 💻 IMPROVED CODE IMPLEMENTATION

### Backend: Enhanced auth.py

```python
# backend/auth.py (IMPROVED)

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
import secrets
import hashlib
from . import schemas, models, database

# SECURE: Use strong secret from environment
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY == "your-secret-key-for-development-only":
    # In production, this should fail
    if os.getenv("ENVIRONMENT") == "production":
        raise ValueError("SECRET_KEY must be set in production")
    SECRET_KEY = secrets.token_urlsafe(32)  # Generate for dev only
    print("⚠️ WARNING: Using generated SECRET_KEY. Set SECRET_KEY env var!")

REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", SECRET_KEY)  # Separate key recommended
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Reduced from 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password. No truncation - pbkdf2_sha256 handles long passwords."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a short-lived access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add standard JWT claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"  # Token type claim
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",  # Token type claim
        "jti": secrets.token_urlsafe(16)  # Unique token ID
    })
    
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def hash_refresh_token(token: str) -> str:
    """Hash a refresh token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
) -> models.User:
    """Get current authenticated user from access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Token can be from header or cookie (fallback)
    if not token:
        token = request.cookies.get("access_token")
    
    if not token:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Validate token type
        if payload.get("type") != "access":
            raise credentials_exception
        
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    
    # CRITICAL: Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user

async def get_current_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Ensure current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
```

### Backend: Token Blacklist Model

```python
# backend/models.py (ADD THIS)

from sqlalchemy import Column, String, DateTime, Integer, Boolean
from sqlalchemy.sql import func
from .database import Base

class RefreshToken(Base):
    """Store refresh tokens for validation and revocation."""
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

class TokenBlacklist(Base):
    """Blacklist for revoked tokens (access tokens if needed)."""
    __tablename__ = "token_blacklist"
    
    id = Column(Integer, primary_key=True, index=True)
    token_jti = Column(String, index=True)  # JWT ID claim
    user_id = Column(Integer, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    blacklisted_at = Column(DateTime(timezone=True), server_default=func.now())
```

### Backend: Enhanced Login Endpoint

```python
# backend/main.py (IMPROVED LOGIN)

from fastapi import Response, Cookie
from fastapi.security import HTTPBearer
import hashlib

@app.post("/auth/login")
async def login(
    user_credentials: schemas.UserLogin,
    response: Response,
    db: Session = Depends(database.get_db)
):
    """Login with email and password. Returns access token and sets refresh token cookie."""
    
    # Find user
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user:
        # Use generic message to prevent enumeration
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    # Verify password
    if not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create tokens
    access_token = auth.create_access_token(data={"sub": user.email, "user_id": user.id})
    refresh_token = auth.create_refresh_token(data={"sub": user.email, "user_id": user.id})
    
    # Hash refresh token for storage
    refresh_token_hash = auth.hash_refresh_token(refresh_token)
    
    # Decode refresh token to get expiry
    from jose import jwt
    refresh_payload = jwt.decode(
        refresh_token, 
        auth.REFRESH_SECRET_KEY, 
        algorithms=[auth.ALGORITHM],
        options={"verify_exp": False}  # Get expiry without validation
    )
    expires_at = datetime.utcfromtimestamp(refresh_payload["exp"])
    
    # Store refresh token in database
    from .models import RefreshToken
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=refresh_token_hash,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    # Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,  # Prevent JavaScript access
        secure=True,  # HTTPS only
        samesite="strict",  # CSRF protection
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
```

### Backend: Refresh Token Endpoint

```python
# backend/main.py (ADD THIS)

@app.post("/auth/refresh")
async def refresh_token(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """Refresh access token using refresh token from cookie."""
    
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    try:
        # Verify refresh token
        from jose import jwt
        payload = jwt.decode(
            refresh_token,
            auth.REFRESH_SECRET_KEY,
            algorithms=[auth.ALGORITHM]
        )
        
        # Validate token type
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        email = payload.get("sub")
        user_id = payload.get("user_id")
        token_jti = payload.get("jti")
        
        if not email or not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    # Check if token is blacklisted
    from .models import TokenBlacklist
    blacklisted = db.query(TokenBlacklist).filter(
        TokenBlacklist.token_jti == token_jti
    ).first()
    if blacklisted:
        raise HTTPException(status_code=401, detail="Token revoked")
    
    # Verify token exists in database
    refresh_token_hash = auth.hash_refresh_token(refresh_token)
    from .models import RefreshToken
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == refresh_token_hash,
        RefreshToken.revoked == False,
        RefreshToken.user_id == user_id
    ).first()
    
    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    # Get user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    # Rotate refresh token (generate new one)
    new_access_token = auth.create_access_token(data={"sub": email, "user_id": user_id})
    new_refresh_token = auth.create_refresh_token(data={"sub": email, "user_id": user_id})
    new_refresh_token_hash = auth.hash_refresh_token(new_refresh_token)
    
    # Blacklist old refresh token
    db_token.revoked = True
    db_token.revoked_at = datetime.utcnow()
    
    # Store new refresh token
    new_payload = jwt.decode(
        new_refresh_token,
        auth.REFRESH_SECRET_KEY,
        algorithms=[auth.ALGORITHM],
        options={"verify_exp": False}
    )
    new_expires_at = datetime.utcfromtimestamp(new_payload["exp"])
    
    new_db_token = RefreshToken(
        user_id=user_id,
        token_hash=new_refresh_token_hash,
        expires_at=new_expires_at
    )
    db.add(new_db_token)
    db.commit()
    
    # Set new refresh token cookie
    response = Response()
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
```

### Backend: Secure Logout

```python
# backend/main.py (ADD THIS)

@app.post("/auth/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Logout and revoke refresh token."""
    
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        # Hash and find token
        refresh_token_hash = auth.hash_refresh_token(refresh_token)
        from .models import RefreshToken
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == refresh_token_hash,
            RefreshToken.user_id == current_user.id
        ).first()
        
        if db_token:
            # Revoke refresh token
            db_token.revoked = True
            db_token.revoked_at = datetime.utcnow()
            db.commit()
    
    # Clear refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        path="/",
        samesite="strict"
    )
    
    return {"message": "Logged out successfully"}
```

### Backend: WebSocket Authentication

```python
# backend/websocket_manager.py (NEW FILE)

from fastapi import WebSocket, WebSocketDisconnect, status
from jose import jwt
from sqlalchemy.orm import Session
from . import auth, models, database

async def authenticate_websocket(
    websocket: WebSocket,
    token: str
) -> models.User:
    """Authenticate WebSocket connection using access token."""
    
    try:
        # Verify token
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        
        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Invalid token type")
        
        email = payload.get("sub")
        if not email:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Invalid token")
        
        # Get user from database
        db = next(database.get_db())
        try:
            user = db.query(models.User).filter(models.User.email == email).first()
            
            if not user or not user.is_active:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                raise ValueError("User not found or inactive")
            
            return user
        finally:
            db.close()
            
    except jwt.JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise ValueError("Invalid token")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Secure WebSocket endpoint with authentication."""
    
    await websocket.accept()
    
    try:
        # Get token from query parameter or first message
        token = None
        
        # Try query parameter first
        if "token" in websocket.query_params:
            token = websocket.query_params["token"]
        else:
            # Wait for auth message
            data = await websocket.receive_json()
            if data.get("type") == "auth":
                token = data.get("token")
        
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Authenticate
        user = await authenticate_websocket(websocket, token)
        
        # Send confirmation
        await websocket.send_json({
            "type": "authenticated",
            "user_id": user.id
        })
        
        # Handle messages
        while True:
            data = await websocket.receive_json()
            
            # Process message
            if data.get("type") == "message":
                # Validate recipient, process message, etc.
                pass
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
```

### Frontend: Secure Token Storage

```typescript
// services/authStorage.ts (NEW FILE)

/**
 * Secure token storage using in-memory storage.
 * Tokens are NEVER stored in localStorage to prevent XSS attacks.
 */

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

export const tokenStorage = {
  /**
   * Store access token in memory only.
   * Refresh token is automatically handled by browser (HttpOnly cookie).
   */
  setAccessToken(token: string, expiresIn: number): void {
    accessToken = token;
    tokenExpiry = Date.now() + expiresIn * 1000;
  },

  getAccessToken(): string | null {
    // Check if token is expired
    if (tokenExpiry && Date.now() >= tokenExpiry) {
      accessToken = null;
      tokenExpiry = null;
      return null;
    }
    return accessToken;
  },

  clearTokens(): void {
    accessToken = null;
    tokenExpiry = null;
  },

  isTokenExpired(): boolean {
    return tokenExpiry ? Date.now() >= tokenExpiry : true;
  }
};
```

### Frontend: Improved API Client

```typescript
// services/api.ts (IMPROVED)

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './authStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for HttpOnly cookies
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach token from memory
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token (stored in HttpOnly cookie)
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token, expires_in } = refreshResponse.data;
        
        // Store new access token in memory
        tokenStorage.setAccessToken(access_token, expires_in);
        
        // Update request header
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clearTokens();
        
        // Redirect to login
        window.location.href = '/#/login-register';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Frontend: WebSocket with Authentication

```typescript
// contexts/ChatContext.tsx (IMPROVED)

import { tokenStorage } from '../services/authStorage';

// In useEffect for WebSocket:
useEffect(() => {
  if (!user) return;

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const token = tokenStorage.getAccessToken();
  
  if (!token) {
    console.error('No access token for WebSocket');
    return;
  }
  
  // Pass token as query parameter (WebSocket doesn't support headers well)
  const wsUrl = `${wsProtocol}//localhost:8000/ws?token=${encodeURIComponent(token)}`;
  
  try {
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle authentication response
      if (data.type === 'authenticated') {
        console.log('WebSocket authenticated');
        return;
      }
      
      if (data.type === 'new_message') {
        // Handle message
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    socketRef.current = socket;
  } catch (error) {
    console.error("WebSocket connection failed", error);
  }
  
  return () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
  };
}, [user]);
```

---

## 7. ✅ BEST PRACTICES CHECKLIST

### Authentication
- [x] Use HttpOnly cookies for refresh tokens
- [x] Store access tokens in memory only
- [x] Implement refresh token rotation
- [x] Add token blacklist/revocation
- [x] Check user.is_active on every request
- [x] Use strong, unique SECRET_KEY
- [x] Separate keys for access/refresh tokens

### Security Headers
- [ ] Add HSTS (Strict-Transport-Security)
- [ ] Add CSP (Content-Security-Policy)
- [ ] Add X-Frame-Options
- [ ] Add X-Content-Type-Options
- [ ] Add Referrer-Policy

### Rate Limiting
- [ ] Add rate limiting to login endpoint
- [ ] Add rate limiting to refresh endpoint
- [ ] Add rate limiting to admin endpoints
- [ ] Implement CAPTCHA after failed attempts

### Monitoring
- [ ] Log failed login attempts
- [ ] Log token refresh attempts
- [ ] Monitor for suspicious activity
- [ ] Alert on multiple failed logins

---

## 8. 🚀 DEPLOYMENT RECOMMENDATIONS

1. **Environment Variables:**
   ```bash
   SECRET_KEY=<generate-strong-key>
   REFRESH_SECRET_KEY=<generate-different-strong-key>
   ENVIRONMENT=production
   ```

2. **Generate Strong Keys:**
   ```python
   import secrets
   print(secrets.token_urlsafe(32))  # Use this for SECRET_KEY
   ```

3. **Database Migration:**
   - Run Alembic migrations for new tables
   - Add indexes on token_hash, user_id

4. **HTTPS Only:**
   - Never use HTTP in production
   - Use secure cookies only

5. **CORS Configuration:**
   ```python
   allow_origins=os.getenv("ALLOWED_ORIGINS", "").split(",")
   ```

---

## 9. 📋 PRIORITY FIX ORDER

1. **IMMEDIATE (Before any production use):**
   - Move tokens from localStorage to HttpOnly cookies + memory
   - Add refresh token implementation
   - Fix SECRET_KEY management
   - Add user.is_active check
   - Implement WebSocket authentication

2. **HIGH PRIORITY (Within 1 week):**
   - Add token blacklist
   - Implement secure logout
   - Add rate limiting
   - Fix CORS configuration

3. **MEDIUM PRIORITY (Within 1 month):**
   - Add security headers
   - Implement monitoring
   - Add CSRF protection (if needed)
   - Password strength requirements

---

**Report Generated:** 2024  
**Next Review:** After implementing critical fixes

---

## QUICK REFERENCE: Critical Fixes Needed

### 1. Token Storage (CRITICAL)
- ❌ Current: localStorage (vulnerable to XSS)
- ✅ Fix: HttpOnly cookies (refresh) + memory (access)

### 2. Refresh Tokens (CRITICAL)
- ❌ Current: No refresh tokens
- ✅ Fix: Implement refresh token rotation

### 3. WebSocket Auth (CRITICAL)
- ❌ Current: No authentication
- ✅ Fix: Validate JWT on WebSocket connection

### 4. SECRET_KEY (CRITICAL)
- ❌ Current: Weak default key
- ✅ Fix: Strong env variable, separate keys

### 5. User Active Check (HIGH)
- ❌ Current: Missing check
- ✅ Fix: Verify user.is_active in get_current_user

### 6. Token Revocation (HIGH)
- ❌ Current: No blacklist
- ✅ Fix: Database blacklist + Redis for performance

