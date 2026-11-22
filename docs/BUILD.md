# MediTrace v3 Build & Deployment Guide

This document details the build processes, prerequisites, environment setup, and deployment artifact paths for the MediTrace v3 platform.

---

## 1. System Requirements & Prerequisites

| Component | Minimum Version | Verified Environment |
|---|---|---|
| **Node.js** | 18.0.0+ | v20.x / v22.x |
| **npm** | 9.0.0+ | v10.x |
| **Java JDK** | OpenJDK 17 LTS | Microsoft OpenJDK 17.0.20.1 |
| **Android SDK** | API Level 34 | Android SDK Tools 34.0.0, NDK 26.1 |
| **Gradle** | 8.10.2 | Bundled Gradle Wrapper (`gradlew.bat`) |
| **Database** | MongoDB 6+ or In-Memory | Embedded `mongodb-memory-server` (Zero-Config) |

---

## 2. Backend Service Build & Launch

The backend is an Express.js API service located in `/backend`.

### Installation & Environment Setup
```bash
cd backend
npm install
```

### Environment Variables (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=meditrace_super_secret_jwt_key_2026_v3
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/meditrace
DRUG_DATA_PROVIDER=composite
CDSCO_DRUG_REGISTRY_PATH=./data/cdsco_registry.json
```
*(Note: If `MONGODB_URI` is unreachable or unset, `mongodb-memory-server` automatically spins up an in-memory instance and runs the v3 seed suite).*

### Running Migrations & Seeding
```bash
# Migrate legacy catalogs to cabinets and backfill profile_ids:
node src/migrations/v3_migration.js

# Seed complete test dataset:
node src/seed.js
```

### Starting the Server
```bash
# Development (with nodemon):
npm run dev

# Production:
npm start
```
- Health Check: `GET http://localhost:5000/api/v1/health`
- API Root: `http://localhost:5000/api/v1`

---

## 3. Web Application Build (React / Vite)

The web client is located in `/web`.

### Installation
```bash
cd web
npm install
```

### Development Server
```bash
npm run dev
```
Serves the web application at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
- **Output Artifact**: `/web/dist/`
- Production assets include minified JavaScript, CSS bundles, bilingual i18n dictionaries, and asset manifests.
- Test production bundle locally: `npm run preview`

---

## 4. Android Mobile Application Build (React Native)

The mobile client is located in `/mobile`.

### Android Build Configuration
1. Ensure `local.properties` specifies the Android SDK path:
   ```properties
   sdk.dir=C\:\\Users\\acer\\AppData\\Local\\Android\\Sdk
   ```
2. Verify Java 17 is active:
   ```powershell
   java -version
   ```

### Assembling Release APK
```powershell
cd mobile\android
.\gradlew.bat assembleRelease --no-daemon
```

### Build Artifact Location
- Gradle outputs the signed release APK to:
  `mobile/android/app/build/outputs/apk/release/app-release.apk`
- The release artifact is copied to:
  `releases/meditrace-v3.apk`

---

## 5. Artifact Verification & Inspection

| Target | Artifact Path | Description |
|---|---|---|
| **Web Distribution** | `web/dist/` | Complete production static bundle |
| **Android APK** | `releases/meditrace-v3.apk` | Release APK ready for sideloading & testing |
| **National Drug DB** | `docs/DRUG_DATA.md` | Architecture and dataset specs |
| **Test Report** | `docs/TEST_REPORT.md` | Automated test suite results |
