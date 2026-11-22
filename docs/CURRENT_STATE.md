# MediTrace Current Architecture & State (v3)

## 1. System Architecture

MediTrace is an enterprise full-stack digital medicine adherence, clinical packaging verification, and family healthcare platform composed of:

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│  │   React Web Platform (Vite) │ │ React Native App        │ │
│  │   - i18n English & Hindi    │ │ - i18n English & Hindi  │ │
│  │   - Cabinet & Family Switch │ │ - 5-Tab Bar (Home, Scan,│ │
│  │   - Floating AI Chatbot     │ │   Medicines, Nearby,    │ │
│  │   - 2-Sided Strip Scanner   │ │   Profile)              │ │
│  │   - Monthly Dose Calendar   │ │ - Floating AI Chatbot   │ │
│  └──────────────┬──────────────┘ └───────────┬─────────────┘ │
└─────────────────┼────────────────────────────┼───────────────┘
                  │                            │
                  ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  Backend REST API Service                    │
│                   (Node.js / Express 4)                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Middleware & Utilities                                 │  │
│  │ - Role-based Auth (Patient, Pharmacist, Doctor, Admin) │  │
│  │ - Profile Scope Resolver (Active Family Profile)       │  │
│  │ - Audit Stamp Helper (Time, TZ, Lat/Lng/Address)       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Core Feature Services                                  │  │
│  │ 1. Cabinet Management (Renamed from Catalog)           │  │
│  │ 2. Dual-Photo OCR & DrugInfoProvider                   │  │
│  │ 3. Stock Tracking (In Stock, Few Left, Out of Stock)   │  │
│  │ 4. Scoped AI Chatbot with Backend Tool Calling         │  │
│  │ 5. Immutable Append-Only Medicine Revisions            │  │
│  │ 6. Monthly Dose Calendar & Missed Dose Job             │  │
│  │ 7. Family Mode Multi-Profile Isolation                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                         Data Tier                            │
│  - MongoDB (with Embedded MongoMemoryServer Zero-Config)     │
│  - Collections: users, profiles, cabinets, cabinet_medicines,│
│    medicines, medicine_revisions, dose_schedules, dose_logs, │
│    chat_messages, abdmdrugs, facilities, retailers           │
└──────────────────────────────────────────────────────────────┘
```

## 2. Key Architectural Upgrades in v3

1. **Role Standard**:
   - Explicit system roles: `patient`, `pharmacist`, `doctor`, `admin`.
2. **Family Profiles & Multi-User Isolation**:
   - Every health record (cabinet, medicine, dose log, schedule, prescription) is scoped by `profile_id`.
   - Access control levels: `owner`, `caregiver_edit`, `caregiver_view`.
3. **Terminology Normalization**:
   - Full migration of legacy `catalog` entities to `Cabinet` across API routes, database schemas, and client UI.
4. **Append-Only Clinical Audit Revisions**:
   - Revision 1 preserves original Pharmacist/Doctor entry.
   - Subsequent user edits append immutable revision records with audit stamps.
5. **National Drug Database Provider (DrugInfoProvider)**:
   - Configurable drug provider interface with local ABDM/CDSCO official registry matching, fallback to OpenFDA/RxNorm.
6. **Scoped AI Chatbot**:
   - Backend function calling only, strictly isolated to logged-in user's active profile, medical disclaimer enforcement, emergency symptom escalation.
