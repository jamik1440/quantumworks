# 🚀 QuantumWorks - Production Deployment Checklist

Step-by-step deployment guide for Vercel, VPS, and Docker.

---

## 📋 Pre-Deployment Requirements

### ✅ Code Ready Checklist

Before ANY deployment:

- [ ] All CRITICAL bugs fixed (see REAL_BUGS_LIST.md)
- [ ] All E2E tests passing
- [ ] No `console.log()` in production code
- [ ] No hardcoded API URLs
- [ ] All secrets in environment variables
- [ ] Production build tested locally
- [ ] Database migrations ready
- [ ] Backup strategy documented

---

## 🎯 Deployment Option 1: Vercel (Frontend Only)

**Best for**: Fast frontend deployment, automatic SSL, CDN  
**Time**: 15-30 minutes

### Step 1: Prepare Frontend

```bash
# 1. Install Tailwind locally (remove CDN)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 2. Update package.json
# Ensure build script exists:
"scripts": {
  "build": "tsc && vite build",
  "preview": "vite preview"
}

# 3. Test production build locally
npm run build
npm run preview
# Visit http://localhost:4173 and test

# 4. Create .env.production
VITE_API_URL=https://api.yourdomain.com
VITE_GEMINI_API_KEY=your_production_key
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? Your account
# - Link to existing project? N
# - Project name: quantumworks
# - Directory: ./ (root)
# - Override build settings? N

# After first deployment, set production env vars:
vercel env add VITE_API_URL production
# Enter: https://api.yourdomain.com

vercel env add VITE_GEMINI_API_KEY production
# Enter: your_key_here

# Deploy to production
vercel --prod
```

### Step 3: Configure Custom Domain

```bash
# In Vercel Dashboard:
# 1. Project Settings > Domains
# 2. Add quantumworks.com
# 3. Configure DNS (Vercel provides instructions)
# 4. Wait for SSL (automatic, ~5 minutes)
```

### Step 4: Vercel-Specific Settings

**File: `vercel.json`** (create in root)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Step 5: Verify Deployment

```bash
# Check your deployment
curl -I https://quantumworks.vercel.app

# Should see:
# HTTP/2 200
# x-vercel-id: ...
# x-frame-options: DENY
```

---

## 🖥️ Deployment Option 2: VPS (Ubuntu + Nginx)

**Best for**: Full control, backend + frontend  
**Time**: 2-3 hours

### Prerequisites

- Ubuntu 20.04+ VPS (DigitalOcean, Linode, AWS EC2)
- Root or sudo access
- Domain name pointed to VPS IP

### Step 1: Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y curl git build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# Install Nginx
apt install -y nginx

# Install Certbot (for SSL)
apt install -y certbot python3-certbot-nginx

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
```

### Step 2: Setup PostgreSQL

```bash
# Switch to postgres user
su - postgres

# Create database
psql
CREATE DATABASE quantumworks;
CREATE USER quantumworks_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE quantumworks TO quantumworks_user;
\q

exit # back to root
```

### Step 3: Deploy Backend

```bash
# Create app directory
mkdir -p /var/www/quantumworks
cd /var/www/quantumworks

# Clone repo (or upload files)
git clone https://github.com/yourusername/quantumworks.git .

# Setup backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create production .env
nano .env

# Add:
DATABASE_URL=postgresql://quantumworks_user:your_secure_password@localhost:5432/quantumworks
SECRET_KEY=your_64_char_secret_key
GEMINI_API_KEY=your_gemini_key
ENVIRONMENT=production
ALLOWED_ORIGINS=https://quantumworks.com

# Save and exit (Ctrl+X, Y, Enter)

# Test backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Create systemd service
nano /etc/systemd/system/quantumworks-api.service
```

**File: `/etc/systemd/system/quantumworks-api.service`**

```ini
[Unit]
Description=QuantumWorks API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/quantumworks/backend
Environment="PATH=/var/www/quantumworks/backend/venv/bin"
ExecStart=/var/www/quantumworks/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Start backend service
systemctl daemon-reload
systemctl enable quantumworks-api
systemctl start quantumworks-api
systemctl status quantumworks-api
```

### Step 4: Deploy Frontend

```bash
cd /var/www/quantumworks

# Install dependencies
npm install

# Build for production
npm run build

# Files will be in /var/www/quantumworks/dist
```

### Step 5: Configure Nginx

```bash
nano /etc/nginx/sites-available/quantumworks
```

**File: `/etc/nginx/sites-available/quantumworks`**

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name quantumworks.com www.quantumworks.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name quantumworks.com www.quantumworks.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/quantumworks.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/quantumworks.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend (React SPA)
    root /var/www/quantumworks/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://127.0.0.1:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/quantumworks /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Get SSL certificate
certbot --nginx -d quantumworks.com -d www.quantumworks.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose 2 (Redirect HTTP to HTTPS)

# Certbot auto-renews, but test renewal:
certbot renew --dry-run
```

### Step 7: Verify Deployment

```bash
# Check backend
curl http://localhost:8000/health

# Check frontend
curl https://quantumworks.com

# Check SSL
curl -I https://quantumworks.com
# Should see: Strict-Transport-Security header
```

---

## 🐳 Deployment Option 3: Docker Compose

**Best for**: Consistent environment, easy scaling  
**Time**: 1-2 hours

### Step 1: Create Docker Files

**File: `Dockerfile.backend`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File: `Dockerfile.frontend`**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**File: `nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://backend:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Step 2: Create Docker Compose File

**File: `docker-compose.prod.yml`**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: quantumworks
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/quantumworks
      SECRET_KEY: ${SECRET_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      ENVIRONMENT: production
    depends_on:
      - postgres
    networks:
      - app_network
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - app_network
    restart: unless-stopped

networks:
  app_network:
    driver: bridge

volumes:
  postgres_data:
```

### Step 3: Create Production .env

**File: `.env.prod`**

```env
DB_USER=quantumworks_user
DB_PASSWORD=secure_random_password_here
SECRET_KEY=your_64_char_secret_key
GEMINI_API_KEY=your_gemini_key
```

### Step 4: Deploy with Docker Compose

```bash
# Pull latest code
git pull origin main

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Verify health
docker-compose -f docker-compose.prod.yml ps
```

### Step 5: Setup SSL (with Nginx Proxy Manager or Caddy)

```bash
# Option 1: Use Caddy (auto-SSL)
# Add to docker-compose.prod.yml:

  caddy:
    image: caddy:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    networks:
      - app_network
```

**File: `Caddyfile`**

```
quantumworks.com {
    reverse_proxy frontend:80
}
```

---

## 🔍 Post-Deployment Verification

### Health Checks

```bash
# Backend health
curl https://quantumworks.com/api/health

# Expected:
# {
#   "status": "healthy",
#   "database": "connected",
#   "timestamp": "..."
# }

# Frontend
curl -I https://quantumworks.com

# Should see:
# HTTP/2 200
# strict-transport-security: max-age=31536000
# x-frame-options: DENY
```

### Functional Tests

```bash
# Run E2E tests against production
TEST_BASE_URL=https://quantumworks.com npm run test:e2e

# Should all pass
```

### Performance Tests

```bash
# Install Lighthouse
npm install -g lighthouse

# Run performance audit
lighthouse https://quantumworks.com --output html --output-path ./lighthouse-report.html

# Should score:
# Performance: >90
# Accessibility: >90
# Best Practices: >90
# SEO: >90
```

---

## 📊 Monitoring Setup

### 1. Uptime Monitoring

```bash
# Use UptimeRobot (free) or similar
# Add checks for:
# - https://quantumworks.com (every 5 minutes)
# - https://quantumworks.com/api/health (every 5 minutes)
```

### 2. Error Tracking (Sentry)

**Frontend** (`src/main.tsx`):

```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 1.0,
  });
}
```

**Backend** (`backend/main.py`):

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

if os.getenv("ENVIRONMENT") == "production":
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
    )
```

### 3. Logging

```bash
# Backend logs
journalctl -u quantumworks-api -f

# Docker logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔄 Rollback Strategy

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

### VPS Rollback

```bash
# Keep backups of dist folder
cp -r /var/www/quantumworks/dist /var/www/quantumworks/dist.backup

# To rollback:
rm -rf /var/www/quantumworks/dist
mv /var/www/quantumworks/dist.backup /var/www/quantumworks/dist
systemctl restart nginx
```

### Docker Rollback

```bash
# Tag images with version
docker build -t quantumworks-frontend:v1.2.3 .

# To rollback:
docker tag quantumworks-frontend:v1.2.2 quantumworks-frontend:latest
docker-compose up -d
```

---

## ✅ Final Production Checklist

Before going live:

- [ ] SSL certificate installed and working
- [ ] All environment variables set
- [ ] Database backed up
- [ ] Secrets rotated from dev values
- [ ] Health check endpoint working
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured
- [ ] Logs accessible
- [ ] Rollback strategy tested
- [ ] Performance > 90 on Lighthouse
- [ ] All E2E tests passing on production
- [ ] 404 page exists
- [ ] Favicon loads
- [ ] SEO meta tags present
- [ ] robots.txt configured
- [ ] sitemap.xml generated

---

**Deployment Complete! 🎉**  
**Next**: See SECURITY_HARDENING_PLAN.md for production security
