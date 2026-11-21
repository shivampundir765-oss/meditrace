# Meditrace: End-to-End Medicine & Health Management Ecosystem

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Backend Tests](https://img.shields.io/badge/backend%20tests-108%20passed%20%2F%2013%20suites-success.svg)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)]()
[![React](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-teal.svg)]()
[![React Native](https://img.shields.io/badge/mobile-Expo%20%2F%20React%20Native-darkcyan.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

> **⚠️ MANDATORY MEDICAL & LEGAL DISCLAIMER**  
> Meditrace is a health management and informational platform designed to assist patients in organizing their prescribed medicines, adherence routines, and pharmacy connections. **Meditrace does not provide medical diagnoses, treatment advice, or replace direct consultations with licensed medical professionals.** In case of an emergency, acute symptoms, or life-threatening adverse drug reactions, call **112 / 911** or visit the nearest emergency room immediately.

---

## 1. Executive Summary & Capabilities

Meditrace solves key challenges in chronic care and everyday healthcare management:
- **Dose Adherence Engine**: Morning, afternoon, evening, and night dose tracking with food instructions (`before_food`, `after_food`, `with_food`, `empty_stomach`), real-time logging, and **automatic cabinet stock deduction**.
- **Predictive Inventory & Expiry Radar**: Computes daily consumption rates based on scheduled regimens, forecasts exact finish dates, and dispatches early warnings for low stock (<= 5 units) and expiring medicine batches (within 30/7 days).
- **AI Optical Scanner & Barcode Lookup**: High-accuracy medicine strip OCR text cleaner extracting medicine name, dosage form, batch number, manufacturer, and expiry date with a confidence score meter and 1-click cabinet autofill.
- **Geospatial Chemist Discovery**: MongoDB `2dsphere` index lookup discovering verified pharmacies within a customizable radius (2–50 km) alongside live medicine availability.
- **Affordable Generic Alternatives**: Salt composition matching comparing branded drugs with certified generic substitutes, displaying direct percentage savings (e.g. 40–50% cost reduction).
- **Prescription-Verified Online Pharmacy**: Shopping cart, prescription verification for Schedule H/X drugs, and test-mode payment gateway integration (Razorpay / Stripe / COD).
- **Auto-Restock on Delivery**: When a partner pharmacy marks an order as `delivered`, Meditrace **automatically adds the delivered quantities into the patient's digital medicine cabinet**.
- **Multi-channel Notifications & Quiet Hours**: In-app notifications tray, simulated device push hooks, and sleep schedule quiet hours (`22:00` - `07:00`) suppressing non-emergency alerts.
- **Doctor Consultation Booking**: Directory search by specialization and city with anti-double-booking concurrency protection (`409 Conflict`).
- **Role-Based Portals**: Dedicated interfaces for `patient`, `doctor`, `retailer`, and `admin`.

---

## 2. Monorepo Architecture

```
medi-trace-project/
├── backend/                  # Node.js / Express / MongoDB REST API & Background Schedulers
│   ├── src/
│   │   ├── config/           # Environment config & MongoDB connection
│   │   ├── controllers/      # 10 modular REST controllers
│   │   ├── middleware/       # JWT auth, RBAC, rate limiting, error handling, Zod validation
│   │   ├── models/           # 14 Mongoose models (2dsphere geospatial indices)
│   │   ├── routes/v1/        # API v1 routes (/auth, /users, /medicines, /schedule, etc.)
│   │   ├── services/         # Business logic & algorithms (OCR, scheduler, stock, shop)
│   │   ├── swagger/          # OpenAPI / Swagger specification
│   │   ├── utils/            # Standardized response format & token generation
│   │   ├── seed.js           # Comprehensive database seeding script
│   │   ├── app.js            # Express application setup
│   │   └── server.js         # Server bootstrap & background cron launcher
│   ├── tests/                # 13 Jest & Supertest automated test suites (108 tests)
│   ├── Dockerfile
│   └── package.json
├── web/                      # React 18 / Vite / Tailwind CSS Web Application
│   ├── src/
│   │   ├── api/              # Axios client with transparent JWT refresh interceptor
│   │   ├── components/       # Common components (DisclaimerBanner, Navbar, Footer, etc.)
│   │   ├── pages/            # 13 complete pages covering all platform features
│   │   ├── store/            # Zustand global stores (useAuthStore, useCartStore)
│   │   ├── App.jsx           # Client router with protected role routes
│   │   └── main.jsx          # Root DOM mounter
│   ├── Dockerfile
│   └── package.json
├── mobile/                   # React Native / Expo Mobile Application
│   ├── src/
│   │   ├── api/              # Fetch API client & async storage abstraction
│   │   ├── components/       # DisclaimerBanner, Header, TabBar
│   │   └── screens/          # AuthScreen, ScheduleScreen, CabinetScreen, ScanScreen, etc.
│   ├── App.js                # Mobile app root with tab navigator
│   ├── Dockerfile
│   └── package.json
├── docs/                     # Technical specifications & interactive demo scripts
│   ├── API_SPEC.md           # API endpoints reference
│   ├── ARCHITECTURE.md       # Architecture & schema designs
│   └── DEMO_SCRIPT.md        # Comprehensive interactive walkthrough script
├── .github/workflows/ci.yml  # GitHub Actions CI workflow
├── docker-compose.yml        # Multi-container orchestration (backend, web, mongo)
└── README.md                 # Complete documentation
```

---

## 3. Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/meditrace`) or MongoDB Atlas URI (or automated in-memory during tests)
- **Docker & Docker Compose** (Optional, for containerized run)

### Step 1: Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/meditrace/meditrace.git
cd medi-trace-project

# Install Backend dependencies
npm --prefix backend install

# Install Web dependencies
npm --prefix web install

# Install Mobile dependencies
npm --prefix mobile install
```

---

### Step 2: Seed the Database with Realistic Demo Data
Run the seeding script to populate users, doctors, verified pharmacies, inventories with generic equivalents, medicine cabinets, and prescriptions:

```bash
npm --prefix backend run seed
```

#### Pre-seeded Demo Credentials
All seeded accounts use password: **`Password123!`**

| Role | Email | Name / Entity | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@meditrace.com` | Meditrace Administrator | System stats & user management |
| **Patient 1** | `patient@meditrace.com` | Arjun Rao | Active doses, cabinet & orders |
| **Patient 2** | `sarah.patient@meditrace.com` | Sarah Khan | Secondary patient |
| **Doctor 1** | `dr.sharma@meditrace.com` | Dr. Ramesh Sharma | Cardiologist (Bangalore, ₹700) |
| **Doctor 2** | `dr.priya@meditrace.com` | Dr. Priya Patel | Dermatologist (Bangalore, ₹500) |
| **Retailer 1** | `apollo.indiranagar@meditrace.com` | Apollo Pharmacy | 24x7 licensed partner stockist |
| **Retailer 2** | `medplus.koramangala@meditrace.com` | MedPlus Pharmacy | Verified partner stockist |

---

### Step 3: Run the Application

#### Option A: Running Locally

1. **Start the Backend Server (Port 5000):**
   ```bash
   npm --prefix backend run dev
   # API running at: http://localhost:5000/api/v1
   # Swagger Docs at: http://localhost:5000/api/docs
   ```

2. **Start the Web Application (Port 5173):**
   ```bash
   npm --prefix web run dev
   # Web Portal accessible at: http://localhost:5173
   ```

3. **Start the Mobile Application (Expo):**
   ```bash
   npm --prefix mobile run start
   # Expo DevTools / QR Code generated for iOS & Android
   ```

#### Option B: Running with Docker Compose

To spin up MongoDB, the backend API, and the web frontend in containers:

```bash
docker-compose up --build
```
- Web Application: `http://localhost:3000` (or configured host port)
- Backend API: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/api/docs`

---

## 4. Automated Test Suite (108 Tests / 13 Suites)

The backend features an automated test suite powered by Jest and Supertest with `mongodb-memory-server` for zero-dependency execution:

```bash
npm --prefix backend test
```

### Test Coverage Overview

```
Test Suites: 13 passed, 13 total
Tests:       108 passed, 108 total
Snapshots:   0 total
Time:        ~80 s
```

| Test Suite | Tests | Features Tested |
| :--- | :---: | :--- |
| `tests/health.test.js` | 3 | Health check, DB connectivity, OpenAPI JSON schema, 404 handler |
| `tests/auth.test.js` | 16 | Registration, bcrypt hashing, dual JWT issuance, refresh token rotation with reuse detection, logout |
| `tests/user.test.js` | 18 | Profile CRUD, quiet hours preferences, password change, soft deactivation, admin RBAC user listing |
| `tests/prescription.test.js` | 6 | Prescription creation, medicine linking, status tracking, retrieval |
| `tests/medicine.test.js` | 8 | Medicine cabinet CRUD, active/expired filters, search by brand/salt |
| `tests/schedule_dose.test.js` | 6 | Daily dose schedule generation, `/schedule/today`, dose action endpoints (`take`/`skip`), **auto-stock decrement** |
| `tests/stock.test.js` | 5 | Daily consumption rate, predicted finish date, refill actions (`add`/`set`), low stock radar, 30-day expiry tracker |
| `tests/notification_cron.test.js` | 7 | Push token registration, in-app notification center, quiet hours evaluation, hourly dose cron, daily stock/expiry cron |
| `tests/scan.test.js` | 7 | OCR strip scanner, regex extractors (Name, Expiry, Batch, Manufacturer), confidence score, GTIN barcode lookup, cabinet auto-fill |
| `tests/chemist_retailer.test.js` | 7 | Retailer profile, drug licence verification, retailer inventory CRUD, `$near` 2dsphere chemist discovery, live stock search |
| `tests/doctor_appointment.test.js` | 6 | Doctor directory search, free slots generator, appointment booking with **anti-double-booking 409 conflict lock**, cancel & reschedule |
| `tests/shop_order_payment.test.js` | 6 | Partner stockist search, generic alternatives comparison with percentage savings, cart operations, prescription check, payment session & webhook, **automatic cabinet stock update upon delivery** |
| `tests/e2e_flow.test.js` | 13 | **Full 9-step end-to-end user lifecycle flow test** linking all platform capabilities |

---

## 5. Interactive API Documentation (Swagger / OpenAPI)

Interactive Swagger documentation is available out of the box:
- **Swagger UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **OpenAPI Specification JSON**: [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)

All API responses follow a standardized JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "errorCode": null
}
```

---

## 6. Security, Privacy & Compliance Protocols

1. **Role-Based Access Control (RBAC)**: Strict role guards restricting clinical profiles to `doctor`, store management to `retailer`, and system administration to `admin`.
2. **Dual-Token Authentication with Rotation**:
   - Short-lived Access Token (15 minutes).
   - Long-lived Refresh Token (7 days) with cryptographic `jti` claim.
   - **Automatic Reuse Detection**: If an old refresh token is reused, the entire token family is revoked to prevent replay attacks.
3. **Medical Disclaimer Enforcement**: Visually prominent and non-dismissible banner across Web and Mobile notifying users that Meditrace does not provide medical diagnoses and to dial 112 / 911 for emergencies.
4. **Schedule H/X Drug Compliance**: Prescription-controlled medicines require a verified prescription ID before orders can be placed.
5. **Quiet Hours Protection**: Patient-configured sleep windows (e.g., 22:00 to 07:00) during which non-urgent reminders are silenced.
6. **Input Validation & Sanitization**: Comprehensive Zod schemas guarding every REST endpoint against SQL/NoSQL injection and malformed payloads.

---

## 7. Interactive Walkthrough & Demo Guide

For a guided, scenario-based walkthrough of all 11 core user journeys with ready-to-run cURL commands, see:  
📖 [docs/DEMO_SCRIPT.md](file:///c:/Users/acer/OneDrive/Desktop/medi%20trace%20project/docs/DEMO_SCRIPT.md)

---

## 8. License

This project is licensed under the **MIT License**.
