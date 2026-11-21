# Meditrace Architecture Documentation

## Overview
Meditrace is an enterprise-grade healthcare and medicine management ecosystem featuring:
- A RESTful backend micro-monolith running Node.js / Express / MongoDB.
- A modern web portal built with React, Vite, Tailwind CSS, and Zustand.
- A cross-platform mobile application powered by React Native and Expo.
- Intelligent medicine scanning (OCR + Barcode recognition).
- Smart alerts and scheduling engine (cron triggers for doses, refills, expiry).
- Geospatial chemist discovery and online medicine marketplace with checkout.

## Repository Structure
```
meditrace/
├── backend/              # Node.js Express REST API & scheduled background jobs
│   ├── src/
│   │   ├── config/       # Environment variables & database connection
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, rate limiting, error handling, validation
│   │   ├── models/       # Mongoose schemas with 2dsphere & relational indices
│   │   ├── routes/       # API route definitions (/api/v1/...)
│   │   ├── services/     # Business logic & 3rd-party integrations
│   │   ├── swagger/      # OpenAPI / Swagger definition and docs
│   │   ├── utils/        # Standardized API response wrappers & helpers
│   │   ├── app.js        # Express application configuration
│   │   └── server.js     # Entry point & graceful shutdown
│   ├── tests/            # Supertest & Jest automated test suites
│   ├── Dockerfile
│   └── package.json
├── web/                  # Vite + React web application
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── mobile/               # React Native + Expo application
│   └── package.json
├── docs/                 # Architecture, schemas, and specifications
├── .github/workflows/    # CI/CD automation
└── docker-compose.yml    # Local multi-container orchestration
```

## Security & Data Integrity
1. **RBAC (Role-Based Access Control)**: Enforced across `patient`, `doctor`, `retailer`, and `admin` roles.
2. **Encrypted Authentication**: Bcrypt password hashing (minimum 10 salt rounds) and dual-token JWT (short-lived access tokens + rotating refresh tokens).
3. **Medical Data Privacy**: Secure uploads, zero secrets stored in source code, strict Joi/Zod input validation, rate limiting, and CORS headers.
4. **Geospatial Queries**: MongoDB 2dsphere indexes for location queries (using GeoJSON Point format).
