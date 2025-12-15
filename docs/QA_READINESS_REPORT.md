# QA Readiness & Release Strategy
**Project:** QuantumWorks AI Marketplace
**Version:** 1.0-RC1
**Date:** 2025-12-15

---

## Part 1: Bug Fix Plan (based on Code Review)

I have performed a static analysis of your current stack against the requested "Live Flow". Here are the identified issues:

| Bug Title | Area | Severity | Root Cause | Fix Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Missing WebSocket Chat** | Backend | 🔴 Critical | `backend/main.py` has no WebSocket endpoints defined. | Implement `ConnectionManager` class and `/ws/chat/{contract_id}` endpoint. |
| **No Refresh Token Flow** | Auth | 🟠 High | `auth.py` only issues Access Tokens (30min). Users will be logged out abruptly. | Add `refresh_token` to `/login` response. Add `/auth/refresh` endpoint. |
| **AI Timeout Handling** | AI | 🟠 High | Gemini API can take 10s+. Frontend blocks UI with no timeout fallback. | Backend: Add `asyncio.wait_for`. Frontend: Add "Processing" skeleton state instead of blocking. |
| **SQLite Concurrency** | DB | 🟠 High | `sqlite` locks the file on write. High concurrency will cause "Database Locked" errors. | Migrate to **PostgreSQL** for production. Use `asyncpg` driver. |
| **Frontend Auth State** | Frontend | 🟡 Medium | `localStorage` approach is insecure (XSS). No auto-redirect on 401 errors. | Move token to `HttpOnly` cookie (Backend). Implement Axios interceptor to redirect to `/login` on 401. |
| **Hardcoded CORS** | Security | 🟡 Medium | `ALLOWED_ORIGINS` logic in `main.py` is brittle. | Use exact strict matching from ENV, reject wildcards entirely in prod. |
| **No Input Sanitization** | Security | 🟡 Medium | `TaskParseRequest` accepts raw string. Prompt Injection risk. | Add basic regex filter to `TaskParseRequest` before sending to Gemini. |

---

## Part 2: Release Checklist (Go/No-Go)

### 🔒 Auth & Security
- [ ] **HTTPS Enforced:** All traffic (API + UI) must happen over port 443.
- [ ] **Secrets Rotated:** The `SECRET_KEY` in `.env` must be rotated before deploy.
- [ ] **Admin Init Disabled:** The automated admin creation script should be disabled or secured with a one-time token.
- [ ] **Rate Limits Tuned:** Verify Redis connection for rate limiting (memory fallback is risky for distributed scale).

### 🚀 Performance
- [ ] **Database Migration:** **MUST** move from SQLite to PostgreSQL.
- [ ] **Asset Compression:** All Three.js models (GLTF) must be Draco compressed.
- [ ] **Lazy Loading:** React routes must use `React.lazy()` or Next.js dynamic imports.

### 🤖 AI Resilience
- [ ] **Fallbacks:** If Gemini API returns 500, show "Manual Entry" form.
- [ ] **Quotas:** Verify the user (Freelancer vs Admin) quotas are actually enforced.

### 📱 User Experience
- [ ] **Mobile Touch:** Verify 3D canvas doesn't hijack scroll on mobile.
- [ ] **Error Toasts:** Replace `alert('Error')` with proper Toast notifications (e.g., `react-hot-toast`).

---

## Part 3: Monitoring & Logging Setup

### Backend (Sentry + Prometheus)

**1. Structured Logging (JSON):**
Don't use `print()`. Use `structlog`.
```python
# Implementation Recommendation
import structlog
logger = structlog.get_logger()
logger.info("user_login", user_id=123, ip="1.2.3.4", status="success")
```

**2. Key Metrics:**
- `http_request_duration_seconds` (Latency)
- `ai_token_usage_total` (Cost tracking)
- `websocket_active_connections` (Chat scale)

### Frontend (Sentry + Vitals)

**1. Error Boundary:**
Wrap the main App component to catch React white-screens.

**2. User Flow Drops:**
Track funnel: `Landing -> CreateJob Click -> AI Parse Success -> Project Posted`.
If Drop rate > 50% at AI Parse, we have a UX or API latency issue.

---

## Part 4: Testing Strategy (See `tests/` folder)

*   **Backend:** `pytest` with `TestClient`. Focus on Auth and AI Quotas.
*   **Frontend:** `Playwright`. Focus on the "Happy Path" (Register -> Post Job).

