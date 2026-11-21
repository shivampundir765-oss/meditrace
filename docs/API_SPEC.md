# Meditrace API Specification

## Standard JSON Response Format
All endpoints return responses in the following unified shape:

### Success Response (HTTP 200/201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response (HTTP 4xx/5xx)
```json
{
  "success": false,
  "data": null,
  "message": "Human-readable error description",
  "errorCode": "RESOURCE_NOT_FOUND"
}
```

## Route Index Prefix: `/api/v1`

### Authentication & Users
- `POST /api/v1/auth/register` - Create user with specific role
- `POST /api/v1/auth/login` - Authenticate & obtain tokens
- `POST /api/v1/auth/refresh` - Rotate access token
- `POST /api/v1/auth/forgot-password` - Trigger reset email
- `GET /api/v1/users/me` - Logged-in profile
- `PUT /api/v1/users/me` - Update profile
- `DELETE /api/v1/users/me` - Remove account and medical data
- `GET /api/v1/admin/users` - Admin user management

### Prescriptions & Medicines
- `POST /api/v1/prescriptions` - Upload prescription
- `GET /api/v1/prescriptions` - List prescriptions
- `POST /api/v1/medicines` - Add medicine
- `GET /api/v1/medicines` - Filter by active/expired
- `POST /api/v1/medicines/:id/schedule` - Create dosage schedule
- `GET /api/v1/schedule/today` - Daily dose list
- `POST /api/v1/doses/:id/take` - Mark dose taken
- `POST /api/v1/doses/:id/skip` - Mark dose skipped

### Stock & Notifications
- `GET /api/v1/stock` - Stock overview
- `PUT /api/v1/stock/:medicineId` - Adjust quantity / refill
- `GET /api/v1/stock/low` - Medicines below threshold
- `GET /api/v1/stock/expiring` - Expiring items
- `GET /api/v1/notifications` - Notifications list

### Chemist Finder, Scanning & Shop
- `POST /api/v1/scan/image` - OCR scanning
- `POST /api/v1/scan/barcode` - Barcode lookup
- `GET /api/v1/chemists/nearby` - Geospatial 2dsphere search
- `GET /api/v1/shop/search` - Medicine catalogue across retailers
- `POST /api/v1/orders` - Place purchase order
- `POST /api/v1/payments/create` - Payment session (test mode)

### Documentation & Health
- `GET /api/v1/health` - System health check
- `GET /api/docs` - OpenAPI/Swagger interactive UI
