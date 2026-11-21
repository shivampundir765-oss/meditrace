# Meditrace: End-to-End Interactive Demonstration Script

This document provides a guided walkthrough of the **Meditrace** ecosystem. It covers 11 sequential scenarios demonstrating the full user lifecycle across all four system roles (`patient`, `doctor`, `retailer`, `admin`).

You can execute these scenarios either:
1. **Via the Web Application UI** at `http://localhost:5173`
2. **Via the Mobile App (Expo)**
3. **Via cURL / REST API** using the endpoints documented below.

---

## Pre-Requisites & Initial Setup

Ensure the backend server is running and the database has been seeded with demo records:

```bash
# Terminal 1: Seed the database
npm --prefix backend run seed

# Terminal 2: Start backend server
npm --prefix backend run dev

# Terminal 3: Start web application
npm --prefix web run dev
```

### Pre-Seeded Accounts (Password: `Password123!`)
- **Patient**: `patient@meditrace.com` (Arjun Rao)
- **Doctor**: `dr.sharma@meditrace.com` (Dr. Ramesh Sharma, Cardiologist)
- **Retailer**: `apollo.indiranagar@meditrace.com` (Apollo Pharmacy)
- **Admin**: `admin@meditrace.com` (Administrator)

---

## Scenario 1: Patient Authentication & JWT Token Issuance

### Goal
Authenticate a patient and receive short-lived access tokens and rotating refresh tokens.

### Web UI
1. Navigate to `http://localhost:5173/auth`.
2. Enter email `patient@meditrace.com` and password `Password123!`.
3. Tap **Sign In**.

### cURL
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@meditrace.com",
    "password": "Password123!"
  }'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Arjun Rao",
      "email": "patient@meditrace.com",
      "role": "patient"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  },
  "message": "Login successful"
}
```

---

## Scenario 2: Doctor Directory, Slot Finder & Appointment Booking

### Goal
Search for a specialist doctor, view real-time daily consultation slots, and book an appointment with anti-double-booking concurrency protection.

### Web UI
1. In the navigation bar, click **Doctors**.
2. Filter by specialization `Cardiologist` and city `Bangalore`.
3. Click **Book Appointment** on Dr. Ramesh Sharma.
4. Pick an upcoming weekday and select a slot (e.g. `10:00 AM`).
5. Confirm booking.

### cURL: Check Free Slots
```bash
curl -X GET "http://localhost:5000/api/v1/doctors?specialization=Cardiologist&city=Bangalore" \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>"
```

### cURL: Book Appointment
```bash
curl -X POST http://localhost:5000/api/v1/appointments \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "<DOCTOR_ID>",
    "slot_start": "2026-11-23T10:00:00.000Z",
    "reason": "Routine hypertension review",
    "consultation_type": "in_person"
  }'
```

### Concurrency Protection Verification
If another patient (or the same patient) attempts to book the exact same `slot_start`, the server immediately responds with:
```json
{
  "success": false,
  "errorCode": "SLOT_ALREADY_BOOKED",
  "message": "This time slot has already been booked by another patient"
}
```

---

## Scenario 3: Prescription Upload & Medicine Cabinet Registration

### Goal
Upload a doctor's prescription and catalogue the prescribed medicine in the digital medicine cabinet.

### Web UI
1. Navigate to **Prescriptions** (`/prescriptions`).
2. Click **Upload New Prescription**, enter Doctor Name "Dr. Ramesh Sharma", Diagnosis "Cardiology & Blood Pressure", and add medicine items.
3. Navigate to **Medicines** (`/medicines`) to see your active medicines catalogue.

### cURL
```bash
curl -X POST http://localhost:5000/api/v1/medicines \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Telmisartan 40mg",
    "dosage_form": "tablet",
    "strength": "40mg",
    "quantity": 10,
    "low_stock_threshold": 5,
    "expiry_date": "2027-12-31"
  }'
```

---

## Scenario 4: Daily Dosage Schedule & Automatic Stock Deduction

### Goal
Set up a dose schedule for a medicine and log a dose as taken. **Verify that the medicine cabinet stock automatically decreases by 1 unit.**

### Web UI
1. Navigate to **Schedule** (`/schedule`).
2. Observe today's scheduled doses grouped by time of day.
3. Click **Mark as Taken** on a pending dose.
4. An instant toast appears: *"Dose logged! 1 unit automatically deducted from medicine cabinet stock."*
5. Check **Medicines** (`/medicines`) — the stock has decremented from 10 to 9!

### cURL: Create Dose Schedule
```bash
curl -X POST http://localhost:5000/api/v1/medicines/<MEDICINE_ID>/schedule \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "dose_amount": "1 tablet",
    "times_per_day": 1,
    "specific_times": ["09:00"],
    "food_instruction": "after_food",
    "start_date": "2026-11-22",
    "days_of_week": [0, 1, 2, 3, 4, 5, 6]
  }'
```

### cURL: Log Dose as Taken
```bash
curl -X POST http://localhost:5000/api/v1/doses/<DOSE_LOG_ID>/take \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "dose": {
      "status": "taken",
      "taken_at": "2026-11-22T00:40:00.000Z"
    },
    "medicine": {
      "name": "Telmisartan 40mg",
      "remaining_quantity": 9
    }
  },
  "message": "Dose marked as taken. Medicine stock updated."
}
```

---

## Scenario 5: Stock Analytics, Finish Date Forecast & Expiry Tracker

### Goal
View intelligent stock analytics calculating daily consumption rates and predicted stockout dates.

### Web UI
1. Navigate to **Stock & Refills** (`/stock`).
2. Review the **Consumption Forecast Card**:
   - Daily Consumption: 1 tablet/day
   - Days Remaining: 9 days
   - Predicted Finish Date: Calculated dynamically based on dosage routines.
3. Check the **30-Day Expiry Radar**: lists medicines approaching expiration (e.g., Vitamin D3).

### cURL
```bash
curl -X GET http://localhost:5000/api/v1/stock \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>"
```

---

## Scenario 6: AI Optical Strip Scanner (OCR) & Barcode Lookup

### Goal
Scan a medicine strip using simulated optical character recognition to extract brand name, batch, expiry, and manufacturer with a confidence score meter.

### Web UI
1. Navigate to **Scan Strip** (`/scan`).
2. Tap **"Sample: Dolo 650 Strip"** or paste raw packaging text.
3. The AI extractor processes the text in real time:
   - **Medicine Name**: DOLO 650 TABLETS
   - **Batch Number**: B240918
   - **Expiry Date**: 2027-04-30
   - **Confidence**: 95%
4. Click **"Save to Medicine Cabinet"** to auto-fill directly into your cabinet with 1 click.

### cURL
```bash
curl -X POST http://localhost:5000/api/v1/scan/image \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "DOLO 650 TABLETS IP\nBatch No: B240918\nMFG: 05/2024\nEXPIRY DATE: 04/2027\nMfd by: Micro Labs Ltd."
  }'
```

---

## Scenario 7: Geospatial Chemist & Stockist Finder

### Goal
Find verified partner pharmacies within a specific radius using MongoDB `2dsphere` geospatial indexing.

### Web UI
1. Navigate to **Chemist Finder** (`/chemists`).
2. Adjust the radius slider (e.g. 10 km).
3. View nearby licensed pharmacies:
   - Apollo Pharmacy Indiranagar (24x7 Open, ~2.1 km away)
   - MedPlus Pharmacy Koramangala (~3.4 km away)
4. Use the search input: *"Search specific medicine in stock"* to check live stock counts.

### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/chemists/nearby?latitude=12.9784&longitude=77.6408&radius=10" \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>"
```

---

## Scenario 8: Online Pharmacy & Generic Substitutes (Savings Calculator)

### Goal
Search medicines across partner pharmacies and compare cheaper generic alternatives sharing the identical active molecule.

### Web UI
1. Navigate to **Shop** (`/shop`).
2. Search for `Dolo 650` or `Metformin`.
3. On the product card, click **"Compare Generic Substitutes"**.
4. The generic alternatives modal displays certified generic brands (e.g. Paracip 650) with a badge: **"Save 48%"** compared to the branded equivalent.
5. Click **"Switch & Add"** to add the affordable generic directly to your shopping cart.

### cURL: Generic Alternatives
```bash
curl -X GET http://localhost:5000/api/v1/shop/alternatives/<BRAND_INVENTORY_ID> \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "cheaperAlternativesCount": 1,
    "alternatives": [
      {
        "medicine_name": "Paracip 650 (Generic)",
        "price": 18,
        "mrp": 35,
        "savings_percentage": 48
      }
    ]
  }
}
```

---

## Scenario 9: Shopping Cart, Rx Verification & Payment Checkout

### Goal
Place an order for medicines. If an item is Schedule H/X (requires prescription), verify that the order requires a valid doctor prescription.

### Web UI
1. Navigate to **Cart** (`/cart`).
2. Review cart items, delivery address, and attached doctor prescription.
3. Select **Payment Method**: Cash on Delivery (COD) or Card / UPI (Instant Test Gateway).
4. Click **Place Order**.
5. The order is created and you are redirected to the order tracking timeline.

### cURL: Place Order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "retailer_id": "<RETAILER_ID>",
    "items": [
      {
        "inventory_id": "<INVENTORY_ID>",
        "quantity": 20
      }
    ],
    "prescription_id": "<PRESCRIPTION_ID>",
    "delivery_address": {
      "street": "14th Cross, Indiranagar",
      "city": "Bengaluru",
      "phone": "9876543210"
    }
  }'
```

---

## Scenario 10: Retailer Dispatch Progression & Auto-Restock on Delivery

### Goal
Log in as a partner pharmacy retailer, manage orders, and mark an order as `delivered`. **Verify that the delivered quantity is automatically credited to the patient's medicine cabinet.**

### Web UI
1. Log out, then log in as retailer `apollo.indiranagar@meditrace.com` (password `Password123!`).
2. In the navigation bar, access **Retailer Portal** (`/retailer`).
3. Under the **Orders** tab, locate the incoming order.
4. Advance the status dropdown: `placed` ➔ `confirmed` ➔ `packed` ➔ `out_for_delivery` ➔ **`delivered`**.
5. Log back in as `patient@meditrace.com`.
6. Visit **Orders** (`/orders`): the 5-step visual delivery timeline is completed with the banner:
   *"Stock Auto-Synced: The delivered medicines have been automatically added into your Medicine Cabinet."*
7. Check **Medicines** (`/medicines`): the quantity has automatically increased by 20 units!

### cURL: Update Order Status to Delivered
```bash
curl -X PUT http://localhost:5000/api/v1/orders/<ORDER_ID>/status \
  -H "Authorization: Bearer <RETAILER_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "note": "Package safely handed to customer"
  }'
```

---

## Scenario 11: Administration Portal & Platform Metrics

### Goal
Log in as system administrator and inspect platform metrics, user distribution, and security controls.

### Web UI
1. Log out, then log in as `admin@meditrace.com` (password `Password123!`).
2. In the navigation bar, access **Admin** (`/admin`).
3. View platform metrics:
   - Total Users
   - Registered Patients
   - Licensed Doctors
   - Partner Retail Pharmacies
4. Filter by role or search users by name.
5. Soft-deactivate or reactivate user accounts.

### cURL: List All Users (Admin Only)
```bash
curl -X GET http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

---

## Troubleshooting & FAQ

- **Database Connection**: Ensure MongoDB is running on port 27017 or pass `MONGODB_URI` via environment variables.
- **Port Conflicts**: Backend uses `5000`, Web uses `5173`. If either is occupied, change the port in `.env` or `vite.config.js`.
- **Resetting Demo Data**: Simply rerun `npm --prefix backend run seed` at any point to restore the clean demo environment.
- **Running Test Suite**: Execute `npm --prefix backend test` anytime to verify all 108 tests.
