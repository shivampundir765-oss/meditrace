# MediTrace v3 Production Deployment Guide

This guide covers deployment instructions for the **Backend API**, **React Web Application**, **Database**, and **Android Mobile APK**.

---

## 1. Quick Start: Single-Command Docker Compose Deployment

The fastest way to deploy the entire stack (MongoDB + Node.js API + Nginx Web) is via Docker Compose.

### Prerequisites
- Docker Engine & Docker Compose installed on your host/server.

### Steps
1. Navigate to the project root:
   ```bash
   cd "medi trace project"
   ```
2. Configure your environment variables in `.env` (or pass them via your orchestration tool):
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb://mongo:27017/meditrace
   JWT_SECRET=your_super_secure_jwt_secret_here
   CLIENT_URL=https://your-production-domain.com
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Run:
   ```bash
   docker compose up --build -d
   ```
4. Access services:
   - **Web UI**: `http://<your-server-ip>:3000`
   - **Backend API**: `http://<your-server-ip>:5000/api/v1`
   - **Health Check**: `http://<your-server-ip>:5000/api/v1/health`

---

## 2. Separate Service Deployment (Cloud / PaaS)

### A. Backend API (Node.js / Express)
- **Platforms**: Render, Railway, Fly.io, AWS Elastic Beanstalk, or VPS (Ubuntu with PM2/Docker).
- **Directory**: `backend/`
- **Build / Runtime Command**:
  ```bash
  npm install --production
  npm start
  ```
- **Environment Variables**:
  - `PORT=5000`
  - `NODE_ENV=production`
  - `MONGODB_URI`: Connection string to MongoDB Atlas or self-hosted replica set.
  - `JWT_SECRET`: Random 256-bit string.
  - `JWT_EXPIRES_IN=15m`
  - `JWT_REFRESH_EXPIRES_IN=7d`
  - `CLIENT_URL`: Your web application domain (e.g. `https://meditrace.example.com`).
  - `GEMINI_API_KEY`: API key for Google Gemini AI assistant & chatbot.
  - `RATE_LIMIT_MAX=1000`

### B. React Web Application (Vite + Nginx / Static CDN)
- **Platforms**: Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront, or Nginx Docker.
- **Directory**: `web/`
- **Build Command**:
  ```bash
  npm --prefix web install
  npm --prefix web run build
  ```
- **Output Directory**: `web/dist`
- **Environment Variables**:
  - `VITE_API_URL`: URL of your deployed backend API (e.g., `https://api.meditrace.example.com/api/v1`).
- **SPA Routing Configuration**:
  - For Nginx: Ensure `try_files $uri $uri/ /index.html;` is configured (included in [web/nginx.conf](file:///c:/Users/acer/OneDrive/Desktop/medi%20trace%20project/web/nginx.conf)).
  - For Vercel / Netlify: The redirect rules are handled automatically with standard SPA rewrite rules.

---

## 3. Database (MongoDB)

- Recommended: **MongoDB Atlas** (M0 free tier or M10+ dedicated cluster).
- Create database user with `readWrite` permissions.
- Whitelist the server/container IP or allow `0.0.0.0/0` with strong password authentication.
- Geospatial indexes (`2dsphere` on facilities/retailers) are created automatically on service initialization.

---

## 4. Mobile Android App (APK Distribution)

- **Release Binary**: Located at [releases/meditrace-v3.apk](file:///c:/Users/acer/OneDrive/Desktop/medi%20trace%20project/releases/meditrace-v3.apk) (82.1 MB).
- **Standalone Offline Capability**: The app works out-of-the-box in standalone mode without a live backend connection.
- **Connecting to Production Backend**:
  1. Open MediTrace on the Android device.
  2. Navigate to **Profile** -> **Backend Server Connection**.
  3. Enter your deployed production backend URL (e.g. `https://api.meditrace.example.com/api/v1`).
  4. Toggle "Standalone Mode" off or test the live connection.

---

## 5. Post-Deployment Verification Checklist

1. [ ] **Health Endpoint**: `GET /api/v1/health` returns status `healthy` and `database: connected`.
2. [ ] **API Docs**: `GET /api/docs.json` serves the OpenAPI 3.0 specification.
3. [ ] **Auth Flow**: Register new patient, log in, verify JWT and refresh tokens.
4. [ ] **Cabinet & Scan**: Create a cabinet, perform a 2-sided packaging scan or barcode lookup.
5. [ ] **AI Assistant**: Test floating chatbot drawer and emergency symptom notice.
6. [ ] **Nearby Search**: Test hospital and pharmacy lookup with geolocation.
