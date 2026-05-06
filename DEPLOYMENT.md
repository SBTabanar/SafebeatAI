# Deployment Guide

This guide covers deploying SafeBeat AI to production using **DigitalOcean App Platform** (backend) and **Vercel** (frontend).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Deploy Backend to DigitalOcean](#deploy-backend-to-digitalocean)
4. [Deploy Frontend to Vercel](#deploy-frontend-to-vercel)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Custom Domain Setup](#custom-domain-setup)
7. [Monitoring & Logs](#monitoring--logs)
8. [Rollback Strategy](#rollback-strategy)

---

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Vercel        │──────▶│   User Browser   │      │                 │
│   (React SPA)   │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      │  DigitalOcean   │
        │                                           │  App Platform   │
        │                                           │  (Flask API)    │
        │                                           │                 │
        │              ┌──────────────────┐         │                 │
        └─────────────▶│  API Calls to    │◀────────┘                 │
                       │  backend URL     │                             │
                       └──────────────────┘
```

- **Frontend (Vercel):** Static React build served via CDN. Fast, global edge network.
- **Backend (DigitalOcean):** Docker container running Flask + ML ensemble. Scales horizontally.

---

## Prerequisites

- [GitHub](https://github.com) account with SafeBeat AI pushed
- [DigitalOcean](https://digitalocean.com) account ($200 free credit for new users)
- [Vercel](https://vercel.com) account (free tier available)
- [doctl](https://docs.digitalocean.com/reference/doctl/) CLI (optional but recommended)

---

## Deploy Backend to DigitalOcean

### Option A: App Platform (Recommended - Zero DevOps)

DigitalOcean App Platform is a managed PaaS that builds and runs Docker containers with automatic HTTPS, load balancing, and zero server management.

#### Step 1: Prepare Your Repo

Ensure your `Dockerfile` is in the repo root (it already is):

```
SafebeatAI/
├── Dockerfile          ← Backend Dockerfile
├── app.py
├── requirements.txt
├── ensemble_models.pkl
├── model_meta.json
└── ...
```

#### Step 2: Create the App

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Choose **"GitHub"** as the source
4. Select your `SBTabanar/SafebeatAI` repository
5. Branch: `main`
6. Click **Next**

#### Step 3: Configure the Service

In the app configuration:

| Setting | Value |
|---------|-------|
| **Type** | Web Service |
| **Name** | safebeat-backend |
| **HTTP Port** | 5001 |
| **Build Command** | *(leave blank - uses Dockerfile)* |
| **Run Command** | *(leave blank - uses Dockerfile CMD)* |

#### Step 4: Set Environment Variables

Click **"Edit"** next to Environment Variables and add:

```
PORT=5001
HOST=0.0.0.0
FLASK_DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://safebeat-frontend.vercel.app
RATE_LIMIT=100 per minute
MODEL_PATH=ensemble_models.pkl
META_PATH=model_meta.json
SECRET_KEY=<generate-with-openssl-rand-hex-32>
API_KEY=<generate-a-random-api-key>
AUDIT_LOG=true
```

> **Generate keys:**
> ```bash
> openssl rand -hex 32   # for SECRET_KEY
> openssl rand -hex 16   # for API_KEY
> ```

#### Step 5: Resource Plan

- **Plan:** Basic ($5/month) is fine for demos. Pro ($12/month) for production.
- **Instance Size:** 1 GB RAM / 1 vCPU minimum (scikit-learn needs memory)
- **Scaling:** Enable horizontal scaling if expecting traffic

#### Step 6: Deploy

Click **"Next"** → **"Create Resources"**

Wait 3-5 minutes for the build. You'll get a URL like:
```
https://safebeat-backend-abc123.ondigitalocean.app
```

**Test it:**
```bash
curl https://safebeat-backend-abc123.ondigitalocean.app/health
```

### Option B: DigitalOcean Droplet (More Control)

If you prefer a VPS:

```bash
# SSH into your droplet
docker run -d \
  -p 5001:5001 \
  -e PORT=5001 \
  -e HOST=0.0.0.0 \
  -e SECRET_KEY=<your-key> \
  -e API_KEY=<your-key> \
  -e CORS_ORIGINS=https://your-frontend.com \
  --name safebeat-backend \
  --restart unless-stopped \
  ghcr.io/sbtabanar/safebeatai-backend:latest
```

---

## Deploy Frontend to Vercel

### Step 1: Prepare the Frontend

The frontend expects an environment variable for the API URL. Create `frontend/.env.production`:

```bash
VITE_API_URL=https://safebeat-backend-abc123.ondigitalocean.app
VITE_API_KEY=<your-api-key-from-digitalocean>
```

> **Important:** Add `.env.production` to `.gitignore` so you don't leak keys. Set it in Vercel's dashboard instead.

### Step 2: Update API Client

In `frontend/src/App.jsx`, ensure the API key is sent with requests:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_KEY = import.meta.env.VITE_API_KEY;

// Set default headers
axios.defaults.headers.common['X-API-Key'] = API_KEY;
axios.defaults.timeout = 15000;
```

### Step 3: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo `SBTabanar/SafebeatAI`
3. **Root Directory:** `frontend`
4. **Framework Preset:** Vite
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`

### Step 4: Set Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://safebeat-backend-abc123.ondigitalocean.app` | Production |
| `VITE_API_KEY` | `your-api-key-here` | Production |

> **Note:** Vite only exposes env vars prefixed with `VITE_` to the client.

### Step 5: Deploy

Click **Deploy**. Vercel builds and deploys in ~30 seconds.

You'll get a URL like:
```
https://safebeat-ai.vercel.app
```

### Step 6: Update CORS

After you have the Vercel URL, update DigitalOcean's `CORS_ORIGINS`:

```
CORS_ORIGINS=https://safebeat-ai.vercel.app
```

Then restart the backend app in DigitalOcean dashboard.

---

## Environment Variables Reference

### Backend (DigitalOcean)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | 5001 | Server port |
| `HOST` | Yes | 0.0.0.0 | Bind address |
| `SECRET_KEY` | Yes | - | Flask secret key (32+ hex chars) |
| `API_KEY` | No | - | If set, requires `X-API-Key` header |
| `CORS_ORIGINS` | Yes | * | Comma-separated allowed frontend URLs |
| `RATE_LIMIT` | No | 100/min | API rate limit |
| `MODEL_PATH` | No | ensemble_models.pkl | Model artifact path |
| `META_PATH` | No | model_meta.json | Model metadata path |
| `AUDIT_LOG` | No | true | Enable prediction audit logging |
| `LOG_LEVEL` | No | INFO | Logging verbosity |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL (no trailing slash) |
| `VITE_API_KEY` | No | API key if backend requires it |

---

## Custom Domain Setup

### Backend (DigitalOcean)

1. In DigitalOcean App Platform, go to **Settings → Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `api.safebeat.app`)
4. Add the CNAME record shown in your DNS provider
5. Wait for SSL to provision (automatic)

### Frontend (Vercel)

1. In Vercel dashboard, go to **Settings → Domains**
2. Enter your domain (e.g., `safebeat.app`)
3. Add the DNS records shown (A or CNAME)
4. Vercel automatically provisions SSL via Let's Encrypt

**Update CORS after custom domain:**
```
CORS_ORIGINS=https://safebeat.app,https://www.safebeat.app
```

---

## Monitoring & Logs

### DigitalOcean

- **Logs:** App Platform → your app → **Runtime Logs** (structured JSON)
- **Metrics:** Built-in CPU, memory, and request metrics
- **Alerts:** Set up alerts for 5xx errors or high response times

### Vercel

- **Analytics:** Built-in Web Vitals and performance monitoring
- **Logs:** Real-time function and edge network logs
- **Errors:** Integrate with Sentry for frontend error tracking

### Recommended: Add Sentry

```bash
# Frontend
cd frontend
npm install @sentry/react

# In main.jsx
import * as Sentry from '@sentry/react';
Sentry.init({ dsn: 'your-sentry-dsn' });
```

---

## Rollback Strategy

### Backend (DigitalOcean)

1. Go to **Apps → safebeat-backend → Deployments**
2. Find the previous working deployment
3. Click **"Rollback"**

Or via Git:
```bash
git revert HEAD
git push origin main
```

### Frontend (Vercel)

1. Go to **Deployments** tab
2. Find the previous working deployment
3. Click **"Promote to Production"**

---

## Cost Estimate

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| DigitalOcean App Platform | Basic (1GB RAM) | ~$5-12 |
| Vercel | Pro (if > 1 team member) | $0-20 |
| Domain (optional) | Namecheap/Cloudflare | ~$10-15/year |
| **Total** | | **~$5-30/month** |

---

## Troubleshooting

### "Server Connection Failed" in Frontend

1. Check DigitalOcean app is running (green dot)
2. Verify `VITE_API_URL` matches DigitalOcean URL exactly
3. Check browser DevTools → Network → look for CORS errors
4. If CORS error: update `CORS_ORIGINS` in DigitalOcean with exact Vercel URL

### "Offline" Status Badge

1. Check `/api/health` returns 200: `curl https://your-backend.com/api/health`
2. If 404: backend route missing or Nginx proxy misconfigured
3. If CORS error: `CORS_ORIGINS` doesn't include frontend domain

### 401 Unauthorized

- You set `API_KEY` on backend but forgot `VITE_API_KEY` on frontend
- Or the header name is wrong (must be `X-API-Key`)

### Build Fails on DigitalOcean

- Check `Dockerfile` is in repo root
- Verify `ensemble_models.pkl` is committed (not gitignored)
- Check build logs for Python dependency errors

---

## Next Steps

1. **Set up a staging environment** using `docker-compose.dev.yml`
2. **Enable Dependabot** for automatic security updates
3. **Set up Uptime Kuma** or Pingdom for monitoring
4. **Configure backups** for any persistent data
5. **Read REVIEW.md** in the repo for the full security roadmap

---

*Deploy with confidence. Monitor with vigilance.*
