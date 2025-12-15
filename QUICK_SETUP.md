# 🚀 QuantumWorks - Quick Setup Guide

## ⚡ XAVFSIZLIK SOZLAMALARI (5 daqiqa)

### 1. `.env` Faylini Yarating

```bash
# .env.example dan nusxa oling
cp .env.example .env
```

### 2. SECRET_KEY Generate Qiling

```bash
# Python yordamida SECRET_KEY yarating
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Natijani `.env` faylidagi `SECRET_KEY` ga qo'ying.

### 3. `.env` Faylini To'ldiring

`.env` faylini oching va quyidagilarni o'zgartiring:

```env
# CRITICAL: O'zgartiring!
SECRET_KEY=<yuqorida-generate-qilgan-key>
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=<kuchli-parol-kiriting>

# AI API key
GEMINI_API_KEY=your_gemini_api_key_here

# CORS (production uchun domeningizni qo'shing)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com
```

### 4. Backend ni Ishga Tushiring

```bash
# Backend papkasiga o'ting
cd backend

# Virtual environment yarating (agar yo'q bo'lsa)
python -m venv venv

# Activate qiling
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Dependencies o'rnating
pip install -r requirements.txt

# Serverni ishga tushiring
python -m uvicorn main:app --reload
```

### 5. Frontend ni Ishga Tushiring

```bash
# Yangi terminal oching
# Root papkada:
npm install
npm run dev
```

## ✅ Tekshirish

1. Backend: http://localhost:8000
2. Frontend: http://localhost:5173
3. API Docs: http://localhost:8000/docs

## 🔒 Xavfsizlik Tekshiruvi

```bash
# Xavfsizlik sozlamalarini tekshiring
python scripts/verify_security.py
```

## 📚 To'liq Qo'llanmalar

- [Security Implementation Guide](./docs/SECURITY_IMPLEMENTATION_GUIDE.md)
- [Security Audit Report](./docs/SECURITY_AUDIT_REPORT.md)
- [Frontend Architecture](./docs/frontend-architecture.md)

## ⚠️ MUHIM ESLATMALAR

1. ❌ **HECH QACHON `.env` ni Git ga commit qilmang!**
2. 🔑 **Barcha default parollarni o'zgartiring!**
3. 🎲 **Production uchun yangi SECRET_KEY generate qiling!**
4. 🔒 **Production da HTTPS yoqing!**

---

**Hammasi tayyor! Loyihangiz xavfsiz va ishga tayyor! 🎉**
