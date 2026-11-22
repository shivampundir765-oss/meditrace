# Meditrace Known Issues & Resolution Log

## 1. Resolved Issues

1. **MongoDB Service Unavailability in Standalone Environments**:
   - **Symptom**: Backend crashed on startup when local MongoDB daemon was not running.
   - **Fix**: Integrated embedded `mongodb-memory-server` in `backend/src/config/db.js` as an automatic zero-config fallback with automated test data seeding.
2. **Axios Response Interceptor Shape Mismatch**:
   - **Symptom**: `TypeError: Cannot read properties of undefined` occurred across multiple frontend pages (`DoctorsPage`, `ShopPage`, `AdminPage`) where pages expected either `res.data.data.*` or `res.data.*`.
   - **Fix**: Updated `web/src/api/client.js` with a self-referencing non-enumerable `.data` getter property on the unwrapped response object, enabling both access patterns transparently.
3. **Route Shadowing in Appointment Routes**:
   - **Symptom**: Accessing `/api/v1/appointments/my` threw a Mongoose `CastError: Cast to ObjectId failed for value "my"` because `/:id` was matched before `/my`.
   - **Fix**: Reordered route definitions in `backend/src/routes/v1/appointment.routes.js` so `/my` is registered before `/:id`.
4. **Android Hermes Release Bundle Parsing Syntax**:
   - **Symptom**: Metro JS bundler during `assembleRelease` failed with `Unexpected keyword 'export'` inside `mobile/src/api/client.js`.
   - **Fix**: Restructured module export declarations to adhere strictly to React Native Hermes CommonJS/ES module requirements.

## 2. Active Focus for v2 Release

1. **Medicine Classification & Clinical Details**:
   - Need comprehensive Indian medicine classification (Common, Chronic, Serious) with purpose ("Used for"), form/strength description, and food-related cautions ("Take after food", "May cause drowsiness") on all medicine cards.
2. **Catalog Architecture & Meal-Based Dose Slots**:
   - Transitioning from raw clock times to human-friendly catalogs (Morning, Afternoon, Evening, Night) with meal timing slots (Breakfast, Lunch, Dinner, Bedtime; before/after food).
3. **Nickname & Quick Reference Support**:
   - Allowing patients to assign intuitive nicknames ("Headache", "Leg pain", "Blood pressure") with suggestion chips and dual-field search across catalog and cabinet.
4. **Time-Wise Sections with Reactive Stock & Expiry Alerts**:
   - Categorized card presentation on dashboard with visual progress indicators, immediate out-of-stock and low-stock replenishment shortcuts, and automatic stock deduction upon marking doses taken.
5. **7-Day Intake Adherence Matrix & Export**:
   - Interactive matrix view (Taken, Missed, Partly taken, Not scheduled, Upcoming) with late dose marking capabilities, weekly adherence metrics, and PDF export functionality.
6. **Unified Nearby Healthcare Discoverer**:
   - Refined Chemists & Hospitals views with dual tabs, live device geolocation, typed postal/city fallback, and 1-tap Google Maps turn-by-turn routing.
7. **Clean Shared Medical Teal Design System**:
   - Unified color tokens, loading skeletons, responsive layouts, 5-tab mobile navigation, and global error boundaries on both Web and Mobile.
