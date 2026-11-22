# MediTrace Known Issues & Migration Tracking

## 1. Resolved in v2
- MongoDB offline crash resolved with automatic `mongodb-memory-server` fallback.
- Unified Axios response interceptor for clean handling of `.data` properties.
- Appointment `/my` vs `/:id` route collision fixed.

## 2. Resolved in v3
1. **Terminology Migration (Completed)**:
   - Migrated all UI text, code, API routes, database schemas, and controllers from `catalog` to `Cabinet`.
   - Backward-compatibility aliases maintained at `/api/v1/catalogs` alongside `/api/v1/cabinets`.
   - Collections: `catalogs` -> `cabinets`, `catalog_medicines` -> `cabinet_medicines`.
2. **Profile Scoping & Family Mode (Completed)**:
   - Multi-profile isolation with `profile_id` scoping on every health record.
   - Default Primary/Self profile generated for existing users with full data backfill via migration `backend/src/migrations/v3_migration.js`.
   - Role authorizations: `owner`, `caregiver_edit`, `caregiver_view`.
3. **Roles Alignment (Completed)**:
   - Added explicit roles `patient`, `pharmacist`, `doctor`, `admin`.
   - Automatic normalization of legacy `retailer` role to `pharmacist`.
4. **Append-Only Medicine Revisions (Completed)**:
   - Implemented `medicine_revisions` collection with Mongoose pre-hooks blocking update and delete operations.
   - Revision 1 records original Pharmacist / Doctor addition with ISO timestamp, timezone, and geolocation.
   - Subsequent patient/caregiver edits append new revision records with field change tracking.
5. **Leaving Scan Guard & Beep Alert (Completed)**:
   - Web Audio API 880Hz tone synthesis with haptic vibration fallback.
   - React Native BackHandler, AppState change, and tab change interception with confirmation modal.
   - Automatic draft saving to `meditrace_scan_draft` and backend `/scan/draft`.
6. **Bilingual Localization (Completed)**:
   - English and Hindi dictionaries implemented for both Web and Mobile.
   - User language switcher in header and profile settings.
7. **AI Chatbot Safety & Scoped Tools (Completed)**:
   - Strict medical disclaimer displayed in chat header, initial modal acknowledgement, and reply footnotes.
   - 7 backend-only tools scoped strictly to the active user's profile.
   - Emergency keyword detection with direct 112 / 108 dialer links.
