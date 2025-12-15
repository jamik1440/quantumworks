# 🚀 QuantumWorks v2.0 - Release Notes (Live Ready)

## ✨ Major Upgrades & Fixes

We have upgraded the stack to "Pro Level" standards, addressing all critical live-readiness issues.

### 🔐 Security & Authentication
- **Refresh Token Rotation**: Implemented robust JWT refresh token flow. Session expiration is no longer a problem.
  - `access_token` (Short lived, 30m)
  - `refresh_token` (Long lived, 7 days)
- **Automatic Auth Recovery**: Frontend now automatically refreshes tokens on 401 errors without logging the user out.
- **WebSocket Security**: All Chat connections are now authenticated via Token. Unsecured access is blocked.

### 💬 Real-time Communication
- **Dual-Mode Chat System**:
  - **Personal Chat**: Private messaging system enabled (`/ws/{user_id}`).
  - **Contract Chat**: Deal-specific secure rooms (`/ws/chat/{contract_id}`).
- **Frontend Integration**: Fixed `ChatContext` to securely transmit auth tokens during handshake.

### 🤖 AI Resilience
- **Timeout Protection**: AI Services (Gemini) are now wrapped in `Async` calls with a **15-second timeout**. Prevents server hanging during high load or AI latency.
- **Async Architecture**: Refactored `TaskAssistantService` and `MatchingService` to be fully asynchronous.

### 🏗️ Infrastructure
- **Database Scalability**: Backend now respects `DATABASE_URL` environment variable. Defaults to SQLite for local, but instantly ready for PostgreSQL in production.
- **Configuration**: Fixed hardcoded API ports (`8005` -> `8000`).

## 🛠️ How to Run

### 1. Backend
```bash
cd backend
# Windows
python -m venv venv
venv\Scripts\activate
# Install deps
pip install -r requirements.txt
# Run Server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend
```bash
# New Terminal
npm run dev
```

## ✅ Verification
- **Login**: Check Network tab for `/auth/login` returning `refresh_token`.
- **Chat**: Open Console, see "WebSocket Connected" without 403 error.
- **AI**: Create a project, notice UI doesn't freeze even if AI is slow.
