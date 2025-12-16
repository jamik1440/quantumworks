# Loyihani Deploy Qilish Yo'riqnomasi

Ushbu qo'llanma QuantumWorks loyihasini Vercel (Front-end) va Render (Back-end) platformalariga joylashtirish uchun mo'ljallangan.

## 1. Back-end Deploy (Render.com)

Backend qismi Python (FastAPI) da yozilgan va Renderda joylashtiriladi.

1.  Render.com saytidan ro'yxatdan o'ting va **New +** -> **Web Service** tanlang.
2.  GitHub repozitoriyangizni ulang.
3.  Sozlamalarni quyidagicha to'ldiring:
    *   **Name:** `quantumworks-backend`
    *   **Region:** Frankfurt (yoki o'zingizga yaqin hudud)
    *   **Root Directory:** `backend`
    *   **Runtime:** Python 3
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4.  **Environment Variables** (Muhit o'zgaruvchilari) bo'limiga quyidagilarni qo'shing:
    *   `PYTHON_VERSION`: `3.11.9` (tavsiya etiladi)
    *   `SECRET_KEY`: (o'zingizning maxfiy kalitingiz)
    *   `ENVIRONMENT`: `production`
    *   `GEMINI_API_KEY`: (Google AI Studio kaliti)
    *   `DATABASE_URL`: (Renderda PostgreSQL ma'lumotlar bazasini yarating va uning "Internal Database URL" manzilini bu yerga qo'ying. Agar SQLite ishlatsangiz, bu shart emas, lekin produkshen uchun PostgreSQL tavsiya etiladi.)

Backend muvaffaqiyatli ishga tushgach, sizga `https://quantumworks-backend.onrender.com` kabi havola beriladi.

## 2. Front-end Deploy (Vercel.com)

Frontend qismi React (Vite) da yozilgan va Vercelda joylashtiriladi.

1.  Vercel.com saytidan ro'yxatdan o'ting va **Add New...** -> **Project** tanlang.
2.  GitHub repozitoriyangizni import qiling.
3.  **Build and Output Settings** bo'limida:
    *   **Framework Preset:** Vite
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist` (Vite odatda `dist` papkasiga build qiladi)
4.  **Environment Variables** bo'limiga quyidagini qo'shing:
    *   `VITE_API_URL`: `https://quantumworks-backend.onrender.com` (Renderdan olgan backend manzilingiz)
5.  **Deploy** tugmasini bosing.

## Qo'shimcha Eslatmalar

*   **CORS:** Backend kodiga `https://quantumworks.vercel.app` ruxsat etilgan domenlar qatoriga qo'shildi. Agar sizning Vercel domeningiz boshqacha bo'lsa (masalan `quantumworks-xyz.vercel.app`), uni backenddagi `ALLOWED_ORIGINS` o'zgaruvchisiga qo'shishingiz kerak bo'ladi.
*   **Ma'lumotlar Bazasi:** Agar siz SQLite (`sql_app.db`) ishlatayotgan bo'lsangiz, har safar deploy bo'lganda ma'lumotlar o'chib ketishi mumkin (chunki Render diskni saqlamaydi). Shuning uchun Renderda "PostgreSQL" xizmatini ochib, uni `DATABASE_URL` orqali ulash tavsiya etiladi.

Omad!
