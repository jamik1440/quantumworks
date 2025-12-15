# Security Implementation Guide
## How to Secure Your QuantumWorks Application

---

## 🚀 Quick Start - Critical Fixes

### Step 1: Remove Hardcoded Credentials (IMMEDIATE)

**Current Issue** (in `backend/main.py`):
```python
admin_email = "jamiksteam@gmail.com"  # ❌ EXPOSED
admin_password = "Jamik1440$"  # ❌ EXPOSED
```

**Fix**:
```python
# backend/main.py
import os

admin_email = os.getenv("ADMIN_EMAIL")
admin_password = os.getenv("ADMIN_PASSWORD")

if not admin_email or not admin_password:
    raise ValueError("ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables")
```

**Create `.env` file**:
```bash
# .env (DO NOT COMMIT TO GIT!)
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-super-secure-password-here
SECRET_KEY=your-secret-key-here
```

**Update `.gitignore`**:
```
.env
.env.local
*.env
```

---

### Step 2: Generate Strong SECRET_KEY

```bash
# Generate a strong secret key
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Add to `.env`:
```
SECRET_KEY=<generated-key-here>
```

Update `backend/auth.py`:
```python
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")
```

---

### Step 3: Secure Admin Init Endpoint

**Option 1: Remove it entirely** (Recommended)
```python
# Delete the /admin/init endpoint from main.py
# Lines 58-89
```

**Option 2: Add authentication**
```python
@app.post("/admin/init")
async def init_admin(
    secret_token: str,
    db: Session = Depends(database.get_db)
):
    # Require secret token
    if secret_token != os.getenv("ADMIN_INIT_SECRET"):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # ... rest of the code
```

---

### Step 4: Add Rate Limiting

Update `backend/main.py`:
```python
from backend.middleware.rate_limiter import (
    rate_limiter,
    login_rate_limit,
    register_rate_limit,
    ai_rate_limit,
    general_rate_limit
)
from backend.middleware.brute_force_protection import (
    brute_force_protection,
    check_brute_force
)
from backend.middleware.ai_protection import (
    ai_protection,
    ai_quota_check,
    get_operation_cost
)
from backend.middleware.security_monitor import (
    security_monitor,
    log_failed_login,
    log_successful_login,
    log_admin_action
)

# Start rate limiter cleanup task
@app.on_event("startup")
async def startup_event():
    rate_limiter.start_cleanup_task()
    # ... existing startup code

# Update login endpoint
@app.post("/auth/login", response_model=schemas.Token)
async def login(
    user_credentials: schemas.UserLogin,
    request: Request,
    db: Session = Depends(database.get_db),
    _: None = Depends(login_rate_limit)  # Add rate limit
):
    client_ip = request.client.host
    
    # Check brute force protection
    check_brute_force(user_credentials.email, client_ip)
    
    # Verify credentials
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        # Record failed attempt
        is_blocked = brute_force_protection.record_failed_login(
            user_credentials.email,
            client_ip
        )
        
        # Log security event
        log_failed_login(user_credentials.email, client_ip)
        
        if is_blocked:
            raise HTTPException(
                status_code=403,
                detail="Too many failed attempts. Account locked for 30 minutes."
            )
        
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Clear failed attempts
    brute_force_protection.clear_failed_attempts(user_credentials.email, client_ip)
    
    # Log successful login
    log_successful_login(user.id, user.email, client_ip)
    
    # Create token
    access_token = auth.create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}

# Update registration endpoint
@app.post("/auth/register", response_model=schemas.UserInDB)
def register(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    _: None = Depends(register_rate_limit)  # Add rate limit
):
    # ... existing code

# Update AI endpoints
@app.post("/ai/task/parse", response_model=schemas.TaskParseResponse)
async def parse_task_input(
    request: schemas.TaskParseRequest,
    current_user: models.User = Depends(ai_quota_check)  # Add AI quota check
):
    try:
        # ... AI processing
        result = assistant.parse_user_input(...)
        
        # Record usage
        ai_protection.record_ai_usage(
            user_id=current_user.id,
            endpoint_type="task_parse",
            estimated_cost=get_operation_cost("task_parse")
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📋 Complete Implementation Checklist

### Phase 1: Critical (Week 1)

- [ ] **Environment Variables**
  - [ ] Create `.env` file
  - [ ] Move all secrets to environment variables
  - [ ] Update `.gitignore`
  - [ ] Generate strong SECRET_KEY
  - [ ] Set ADMIN_EMAIL and ADMIN_PASSWORD

- [ ] **Remove Hardcoded Credentials**
  - [ ] Update `main.py` startup function
  - [ ] Update `/admin/init` endpoint
  - [ ] Remove any other hardcoded secrets

- [ ] **Rate Limiting**
  - [ ] Add rate limiter to login endpoint
  - [ ] Add rate limiter to registration endpoint
  - [ ] Add rate limiter to AI endpoints
  - [ ] Start cleanup task on startup

- [ ] **Brute Force Protection**
  - [ ] Integrate with login endpoint
  - [ ] Add account lockout mechanism
  - [ ] Add IP blocking for enumeration

### Phase 2: High Priority (Week 2)

- [ ] **AI Protection**
  - [ ] Add quota checks to all AI endpoints
  - [ ] Record usage after each call
  - [ ] Implement cost tracking
  - [ ] Add usage stats endpoint

- [ ] **Security Monitoring**
  - [ ] Log all failed login attempts
  - [ ] Log all admin actions
  - [ ] Set up alerting thresholds
  - [ ] Create security dashboard endpoint

- [ ] **Input Validation**
  - [ ] Add Pydantic models for all inputs
  - [ ] Validate email formats
  - [ ] Sanitize user inputs
  - [ ] Add length limits

- [ ] **CORS Configuration**
  - [ ] Use environment-based origins
  - [ ] Restrict methods and headers
  - [ ] Add max_age

### Phase 3: Medium Priority (Week 3-4)

- [ ] **Cookie Security**
  - [ ] Set `httponly=True`
  - [ ] Set `secure=True` (HTTPS only)
  - [ ] Set `samesite="strict"`

- [ ] **WebSocket Security**
  - [ ] Add JWT authentication
  - [ ] Add message rate limiting
  - [ ] Add message size limits
  - [ ] Implement connection limits

- [ ] **Security Headers**
  - [ ] Add CSP header
  - [ ] Add HSTS header
  - [ ] Add X-Frame-Options
  - [ ] Add X-Content-Type-Options

- [ ] **Audit Logging**
  - [ ] Log all admin actions
  - [ ] Log data exports
  - [ ] Log role changes
  - [ ] Log deletions

---

## 🔒 Security Headers Middleware

Add to `backend/main.py`:

```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    return response
```

---

## 📊 Security Dashboard Endpoint

Add to `backend/main.py`:

```python
@app.get("/admin/security/summary")
async def get_security_summary(
    hours: int = 24,
    admin_user: models.User = Depends(auth.get_current_admin)
):
    """Get security summary - Admin only"""
    return security_monitor.get_security_summary(hours=hours)

@app.get("/admin/security/events")
async def get_security_events(
    limit: int = 100,
    event_type: Optional[str] = None,
    admin_user: models.User = Depends(auth.get_current_admin)
):
    """Get recent security events - Admin only"""
    events = security_monitor.events[-limit:]
    
    if event_type:
        events = [e for e in events if e['event_type'] == event_type]
    
    return {"events": events, "total": len(events)}

@app.get("/admin/ai/usage/{user_id}")
async def get_user_ai_usage(
    user_id: int,
    admin_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    """Get AI usage stats for a user - Admin only"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    stats = ai_protection.get_usage_stats(user_id)
    
    return {
        "user_id": user_id,
        "email": user.email,
        "role": user.role,
        "usage": stats
    }
```

---

## 🧪 Testing Security

### Test Rate Limiting

```bash
# Test login rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:8000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

### Test AI Quota

```bash
# Test AI quota (should block after limit)
TOKEN="your-jwt-token"
for i in {1..15}; do
  curl -X POST http://localhost:8000/ai/task/parse \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"user_input":"test"}'
  echo ""
done
```

---

## 📝 Environment Variables Reference

```bash
# .env file

# Database
DATABASE_URL=postgresql://user:password@localhost/quantumworks

# Security
SECRET_KEY=<generate-with-secrets.token_urlsafe(64)>
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=<strong-password-here>
ADMIN_INIT_SECRET=<another-secret-for-init-endpoint>

# AI
GEMINI_API_KEY=your-gemini-api-key

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Redis (optional, for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# Email (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL=security@yourcompany.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

## 🚨 Emergency Response Plan

### If Credentials Are Compromised:

1. **Immediately**:
   ```bash
   # Generate new SECRET_KEY
   python -c "import secrets; print(secrets.token_urlsafe(64))"
   
   # Update .env
   # Restart application
   ```

2. **Reset Admin Password**:
   ```python
   # In Python shell
   from backend import database, models, auth
   db = database.SessionLocal()
   admin = db.query(models.User).filter(models.User.role == "admin").first()
   admin.hashed_password = auth.get_password_hash("new-secure-password")
   db.commit()
   ```

3. **Invalidate All Tokens**:
   - Change SECRET_KEY (invalidates all JWTs)
   - Force all users to re-login

4. **Check Logs**:
   ```python
   # Check security events
   events = security_monitor.export_events(
       start_time=datetime.now() - timedelta(days=7)
   )
   ```

---

## ✅ Security Verification

Run this script to verify security implementation:

```python
# scripts/verify_security.py
import os
import sys

def verify_security():
    checks = []
    
    # Check environment variables
    checks.append(("SECRET_KEY set", bool(os.getenv("SECRET_KEY"))))
    checks.append(("ADMIN_EMAIL set", bool(os.getenv("ADMIN_EMAIL"))))
    checks.append(("ADMIN_PASSWORD set", bool(os.getenv("ADMIN_PASSWORD"))))
    
    # Check .env in .gitignore
    with open(".gitignore") as f:
        gitignore = f.read()
        checks.append((".env in .gitignore", ".env" in gitignore))
    
    # Print results
    print("\n🔒 Security Verification\n")
    all_passed = True
    for check, passed in checks:
        status = "✅" if passed else "❌"
        print(f"{status} {check}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n✅ All security checks passed!")
    else:
        print("\n❌ Some security checks failed. Please fix them.")
        sys.exit(1)

if __name__ == "__main__":
    verify_security()
```

---

**Implementation Complete!** 🎉

Follow this guide step-by-step to secure your application. Start with Phase 1 (Critical) immediately.
