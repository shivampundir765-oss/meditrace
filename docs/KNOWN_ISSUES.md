# MediTrace Known Issues & Migration Tracking

## 1. Resolved in v2
- MongoDB offline crash resolved with automatic `mongodb-memory-server` fallback.
- Unified Axios response interceptor for clean handling of `.data` properties.
- Appointment `/my` vs `/:id` route collision fixed.

## 2. In-Flight Upgrades for v3
1. **Terminology Migration**:
   - Legacy routes `/api/v1/catalogs` must be migrated to `/api/v1/cabinets` with backward compatibility redirect/alias to prevent any client breaking change.
   - Collections: `catalogs` -> `cabinets`, `catalog_medicines` -> `cabinet_medicines`.
2. **Profile Scoping**:
   - Legacy records currently lack `profile_id`. A database migration script must generate a default Self profile for every user and backfill `profile_id` on all medicines, cabinets, prescriptions, schedules, and dose logs.
3. **Roles Alignment**:
   - Align legacy `retailer` role to `pharmacist` role seamlessly in user schemas and auth middleware.
4. **Append-Only Revisions**:
   - Medicines must enforce `medicine_revisions` records on all write and edit paths, locking revision 1 against mutation.
5. **Leaving Scan Guard**:
   - Browser beforeunload + React navigation interceptors + expo-av / Web Audio API tone synthesis to sound a warning beep and display the leave confirmation dialog.
