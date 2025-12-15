# ⚡ QuantumWorks - Quick Fix Action Plan

**Priority**: CRITICAL BLOCKERS ONLY  
**Timeline**: 5-7 days  
**Goal**: Minimum viable production launch

---

## 🔴 Day 1: Infrastructure & Testing (8 hours)

### Morning (4h)
```bash
# 1. Add Health Check Endpoint (1h)
# File: backend/main.py
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Unhealthy: {str(e)}")

# 2. Fix Failing Tests (3h)
cd backend
pytest tests/backend/test_main.py -v
# Fix the 2 failing tests
# Likely: /health endpoint + auth issue
```

### Afternoon (4h)
```bash
# 3. Setup PostgreSQL (2h)
docker run --name quantumworks-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=quantumworks \
  -p 5432:5432 \
  -d postgres:15

# Update .env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/quantumworks

# 4. Test Database Migration (2h)
python backend/database.py
# Verify all tables created
```

---

## 🔴 Day 2: Security - Token Storage (8 hours)

### Morning (4h)
```bash
# 1. Backend: Add httpOnly Cookie Support (2h)
# File: backend/main.py (login endpoint)

from fastapi import Response

@app.post("/auth/login")
async def login(
    user_credentials: schemas.UserLogin,
    response: Response,
    db: Session = Depends(database.get_db)
):
    # ... existing validation ...
    
    access_token = auth.create_access_token(...)
    refresh_token = auth.create_refresh_token(...)
    
    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # Requires HTTPS
        samesite="strict",
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
        # DON'T return refresh_token in body
    }

# 2. Test Cookie Flow (2h)
# Use Postman/Insomnia to verify cookies set
```

### Afternoon (4h)
```bash
# 3. Frontend: Update Token Handling (4h)
# File: src/services/api.ts

// REMOVE localStorage usage
// localStorage.removeItem('token');  ❌
// localStorage.removeItem('refresh_token');  ❌

// Store access token in React state/context instead
// Refresh token is in httpOnly cookie (frontend can't access)

// Update axios interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
            error.config._retry = true;
            
            try {
                // Refresh token is sent automatically via cookie
                const { data } = await axios.post('/auth/refresh', {}, {
                    withCredentials: true  // Important!
                });
                
                // Update access token in memory
                error.config.headers.Authorization = `Bearer ${data.access_token}`;
                return api(error.config);
            } catch (refreshError) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
```

---

## 🔴 Day 3: Error Boundaries & Token Revocation (8 hours)

### Morning (4h)
```bash
# 1. Add React Error Boundary (2h)
# File: src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // TODO: Send to Sentry
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

# 2. Wrap App (1h)
# File: src/main.tsx or index.tsx

import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById('root')
);
```

### Afternoon (4h)
```bash
# 3. Token Blacklist Database Table (2h)
# File: backend/models.py

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"
    
    id = Column(Integer, primary_key=True)
    token_jti = Column(String, unique=True, index=True)  # JWT ID
    user_id = Column(Integer, ForeignKey("users.id"))
    blacklisted_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

# Run: Create tables
python -c "from backend import models, database; models.Base.metadata.create_all(bind=database.engine)"

# 4. Implement Logout with Revocation (2h)
# File: backend/main.py

@app.post("/auth/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if refresh_token:
        try:
            payload = jwt.decode(refresh_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
            token_jti = payload.get("jti")
            
            # Blacklist token
            blacklist_entry = models.TokenBlacklist(
                token_jti=token_jti,
                user_id=current_user.id,
                expires_at=datetime.fromtimestamp(payload["exp"])
            )
            db.add(blacklist_entry)
            db.commit()
        except Exception as e:
            print(f"Error blacklisting token: {e}")
    
    # Clear cookie
    response.delete_cookie("refresh_token", path="/")
    
    return {"message": "Logged out successfully"}
```

---

## 🔴 Day 4: SECRET_KEY & Environment Setup (6 hours)

### Morning (3h)
```bash
# 1. Generate Production Secrets (1h)
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(64))"
python -c "import secrets; print('REFRESH_SECRET_KEY=' + secrets.token_urlsafe(64))"
python -c "import secrets; print('ADMIN_PASSWORD=' + secrets.token_urlsafe(32))"

# Add to .env (NEVER commit this file!)

# 2. Update auth.py for Better Secret Handling (2h)
# File: backend/auth.py

SECRET_KEY = os.getenv("SECRET_KEY")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", SECRET_KEY)

if not SECRET_KEY:
    if os.getenv("ENVIRONMENT") == "production":
        raise ValueError("SECRET_KEY is required in production!")
    else:
        SECRET_KEY = secrets.token_urlsafe(64)
        print("⚠️ WARNING: Generated temporary SECRET_KEY for development")
        print("   Set SECRET_KEY in .env for production!")
```

### Afternoon (3h)
```bash
# 3. Frontend Environment Variables (2h)
# File: .env.local (create if not exists)

VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your_key_here

# Update api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

# 4. Create Production .env Template (1h)
# File: .env.production (template only, not actual secrets)

# Copy .env.example to .env.production
# Document required vs optional variables
# Add deployment checklist
```

---

## 🔴 Day 5: Testing & Docker (8 hours)

### Morning (4h)
```bash
# 1. Write Missing Critical Tests (3h)
# File: tests/backend/test_auth.py (new file)

def test_login_sets_cookie(client):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "refresh_token" in response.cookies
    
def test_logout_clears_cookie(client, auth_headers):
    response = client.post("/auth/logout", headers=auth_headers)
    assert response.status_code == 200
    assert "refresh_token" not in response.cookies

def test_token_refresh_with_cookie(client):
    # Login first
    login_res = client.post("/auth/login", json={...})
    cookie = login_res.cookies["refresh_token"]
    
    # Refresh
    refresh_res = client.post("/auth/refresh", cookies={"refresh_token": cookie})
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()

# Run all tests
pytest tests/ -v --cov=backend --cov-report=term-missing

# 2. Fix Any Failing Tests (1h)
```

### Afternoon (4h)
```bash
# 3. Create Docker Setup (4h)
# File: Dockerfile (backend)

FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# File: docker-compose.yml (update existing)

version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: quantumworks
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/quantumworks
      SECRET_KEY: ${SECRET_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - postgres
  
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:8000

volumes:
  postgres_data:

# Test Docker Setup
docker-compose up -d
docker-compose logs -f
```

---

## 🔴 Day 6-7: Polish & Deploy Testing (12 hours)

### Day 6 Morning (4h)
```bash
# 1. Fix Console Errors (2h)
# - Add favicon.ico to /public
# - Fix 404 errors for /admin/users (remove or protect)
# - Handle WebGL Context Lost

# File: src/components/three/WebGLErrorHandler.tsx
useEffect(() => {
  const canvas = rendererRef.current?.domElement;
  if (!canvas) return;
  
  const handleContextLost = (e) => {
    e.preventDefault();
    console.warn('WebGL context lost, attempting recovery...');
    setWebGLError(true);
  };
  
  const handleContextRestored = () => {
    console.log('WebGL context restored');
    setWebGLError(false);
  };
  
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);
  
  return () => {
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
  };
}, []);

# 2. Add Loading States (2h)
# File: src/components/LoadingSpinner.tsx
# Add to all async operations
```

### Day 6 Afternoon (4h)
```bash
# 3. Build Production Frontend (2h)
npm run build
# Test production build
npm run preview

# Check bundle size
npx vite-bundle-visualizer

# 4. Security Headers (2h)
# File: backend/main.py

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    if os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response
```

### Day 7 (4h)
```bash
# 5. Deployment Dry Run (4h)

# Local production test:
export ENVIRONMENT=production
export DATABASE_URL=postgresql://...
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(64))")

# Start services
docker-compose -f docker-compose.prod.yml up

# Smoke Tests:
curl http://localhost:8000/health
curl http://localhost:5173

# Test critical paths:
# - Register user
# - Login
# - Create project
# - View projects
# - Logout

# Document any issues
```

---

## ✅ Post-Fix Verification Checklist

After completing all fixes, verify:

```bash
# Backend
[ ] Health check returns 200
[ ] All tests passing (pytest)
[ ] PostgreSQL connected
[ ] Cookies set on login
[ ] Logout revokes token
[ ] Refresh token rotates

# Frontend  
[ ] No console errors
[ ] Error boundary catches errors
[ ] Loading states show
[ ] Login/logout works
[ ] Projects load
[ ] No XSS warnings

# Infrastructure
[ ] Docker builds successfully
[ ] docker-compose up works
[ ] Environment variables loaded
[ ] Database persists data
[ ] Nginx config valid (if using)

# Security
[ ] No secrets in code
[ ] .env in .gitignore
[ ] HTTPS redirect works (production)
[ ] CORS configured correctly
[ ] Rate limiting active
```

---

## 🚀 Deployment Commands (Production)

```bash
# 1. Pre-deployment
git checkout -b production-release
git merge main
npm run build
pytest tests/ -v

# 2. Deploy (example: DigitalOcean)
doctl apps create --spec .do/app.yaml

# 3. Post-deployment
curl https://yourdomain.com/health
# Monitor logs
# Check error tracking (Sentry)

# 4. Rollback plan
git revert HEAD
git push origin production-release --force
# Redeploy
```

---

## 📊 Success Metrics

After fixes, you should see:

- ✅ **0 console errors** on page load
- ✅ **100% tests passing**
- ✅ **<500ms** API response time
- ✅ **No XSS vulnerabilities**
- ✅ **PostgreSQL** handling 50+ concurrent users
- ✅ **Uptime monitoring** active

---

## 🆘 If You Get Stuck

### Common Issues:

**"Database locked" error**:
```bash
# You're still using SQLite
# Switch to PostgreSQL (see Day 1)
```

**"CORS error" on frontend**:
```bash
# Check backend ALLOWED_ORIGINS includes frontend URL
# Check frontend uses withCredentials: true for cookies
```

**"Context lost" WebGL error**:
```bash
# Add error handling (see Day 6)
# Fallback to 2D mode
```

**"Secret key not found"**:
```bash
# Set in .env file
# Never commit .env!
```

---

## 📚 Resources

- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **Docker Docs**: https://docs.docker.com/
- **PostgreSQL Setup**: https://www.postgresql.org/docs/

---

**This plan focuses ONLY on critical blockers. For full production readiness, see `PRODUCTION_READINESS_AUDIT.md`**

**Good luck! 🚀**
