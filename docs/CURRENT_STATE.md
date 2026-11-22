# Meditrace Current State & Architecture Summary

## 1. System Architecture Overview

Meditrace is a comprehensive digital medicine adherence, verification, and healthcare discovery platform consisting of three primary tiers:

```
┌────────────────────────────────────────────────────────┐
│                   Client Layer                         │
│  ┌────────────────────────┐  ┌──────────────────────┐  │
│  │   React Web Platform   │  │ React Native Mobile  │  │
│  │   (Vite + Tailwind)    │  │ (Android APK/Hermes) │  │
│  └───────────┬────────────┘  └──────────┬───────────┘  │
└──────────────┼──────────────────────────┼──────────────┘
               │                          │
               ▼                          ▼
┌────────────────────────────────────────────────────────┐
│                   Backend REST API                     │
│               (Node.js / Express 4.x)                  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Controllers & Business Logic Services           │  │
│  │  - Auth & Role-Based Access Control              │  │
│  │  - Medicine Management & Schedule Tracking       │  │
│  │  - Scan OCR & ABDM Drug Registry Enrichment      │  │
│  │  - Google Maps & Overpass Healthcare Locator     │  │
│  │  - Retailer Hub, Doctor Booking & Test Orders    │  │
│  └──────────────────────────┬───────────────────────┘  │
└─────────────────────────────┼──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│                   Data Tier                            │
│  - MongoDB (with Embedded In-Memory Mongo Fallback)    │
│  - Collections: users, medicines, dose_schedules,      │
│    dose_logs, abdmdrugs, facilities, retailers,        │
│    doctors, appointments, orders, notifications        │
└────────────────────────────────────────────────────────┘
```

## 2. Codebase Structure

- `/backend`:
  - `src/server.js`: HTTP server entry point, connects DB, initializes cron jobs, starts on port 5000.
  - `src/app.js`: Express app setup, CORS, Helmet, rate limiting, request logging, error handler.
  - `src/config/db.js`: Hybrid MongoDB connection; connects to local MongoDB or spins up `mongodb-memory-server` with auto-seeding.
  - `src/models/`: Mongoose models for User, Medicine, DoseSchedule, DoseLog, Scan, Notification, Retailer, Doctor, Appointment, Order, AbdmDrug, Facility.
  - `src/routes/v1/`: Versioned API endpoints mounted under `/api/v1/` (auth, users, medicines, schedule, dose, scan, stock, notifications, chemists, doctors, appointments, shop, orders, retailer, admin, abdm, places).
  - `src/services/`: Core logic including OCR/ABDM scan enrichment (`scan.service.js`), ABDM drug registry (`abdm.service.js`), healthcare place locator (`facility.service.js`), notification service.
- `/web`:
  - React 18 SPA built with Vite and Tailwind CSS.
  - Client state and routing managed via React Router v6.
  - Pages: HomePage (Dashboard), ScanPage, CabinetPage, ChemistFinderPage, DoctorsPage, ShopPage, CartPage, OrdersPage, ProfilePage, RetailerDashboardPage, AdminPage, LoginPage, RegisterPage.
  - Common components: Navbar, Footer, MeditraceLogo, GoogleHealthcareMap.
- `/mobile`:
  - React Native application targeting Android with Hermes engine and Expo modules.
  - Core navigation stack with screens: AuthScreen, HomeScreen, CabinetScreen, ScanScreen, ScheduleScreen, ChemistShopScreen.
- `/docs`:
  - Architecture, API specifications, and quality assurance logs.

## 3. Existing Features

1. **Authentication & Multi-Role Authorization**:
   - JWT access tokens + refresh tokens.
   - Roles: Patient, Doctor, Retailer, Admin with protected route guards.
2. **Medicine Inventory & Schedule**:
   - Tracking medicines, batch codes, expiry dates, stock quantities, dosage instructions.
   - Today's dose schedule with mark taken/skipped actions.
3. **Smart Medicine Scan & ABDM Registry**:
   - Strip image OCR and barcode lookup.
   - ABDM Drug Registry lookup returning CDSCO approval status, Indian brand names, generic formulations, and statutory Schedule H/H1 warnings.
4. **Healthcare & Pharmacy Locator**:
   - Interactive Google Maps integration with custom markers and attribution.
   - Locates registered retailers with real-time medicine inventory, as well as nearby hospitals and pharmacies within user-selected radius (1, 3, 5, 10, 25 km).
5. **Doctor Consultations & Appointments**:
   - Search doctor directory by specialization and book appointment slots.
6. **Shop & Order Flow**:
   - Medicine search, cart management, simulated checkout, and order history.
7. **Retailer & Admin Portals**:
   - Retailer inventory and order fulfillment management.
   - Admin user management and system health monitoring.
