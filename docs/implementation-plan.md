# HospitalX — Implementation Plan & Migration Roadmap

**Document Version:** 1.0.0  
**Status:** Phase 1 Complete (Backend Foundation)  
**Date:** October 2026  

---

## 1. Roadmap Overview & Milestones

```
Phase 1: Backend Foundation & Core REST APIs [COMPLETED]
    ├── Standalone Node.js / Express / TypeScript backend
    ├── MySQL 8 + Prisma ORM schema & migrations
    ├── Enterprise RBAC & Multi-Tenant Isolation
    ├── Concurrency-Safe Appointment Engine
    ├── Security Audit Logging & Input Validation
    └── Vitest Automated Test Suite (29 tests)

Phase 2: Frontend Client Integration & Firebase Transition [NEXT]
    ├── Generate TypeScript API client & TanStack Query hooks
    ├── Replace client-side AuthContext with /api/v1/auth/login
    ├── Connect Patient Booking Wizard to /api/v1/appointments
    ├── Connect Admin Portal to /api/v1/admin/metrics & queues
    └── Decommission direct browser Firestore & localStorage calls

Phase 3: Clinical & Operations Expansion [UPCOMING]
    ├── Nurse Triage Station & Vital Signs Capture
    ├── Walk-in Reception Desk & Barcode / QR Patient Check-In
    ├── Doctor Clinical Notes (EMR) & Electronic Prescriptions
    └── Itemized Billing, Insurance Claims & Payments (Stripe)

Phase 4: Telehealth & Live Streaming [PLANNED]
    ├── Real-Time WebRTC Video/Audio Consultation Rooms
    ├── Interactive Consultation Chat & File Exchange
    └── Live Patient Queue Display via WebSockets / SSE
```

---

## 2. Phase 1 Achievements (Completed Work)

1. **Workspace Preservation:**
   * Root `package.json` created with unified workspace commands (`dev`, `build`, `build:frontend`, `build:backend`, `test:backend`).
   * Existing React 19 frontend untouched and confirmed building cleanly.
   * Root `.gitignore` created to protect environment files and prevent credential leaks.

2. **Backend Foundation:**
   * Express 4 + TypeScript 5 application structured in `backend/`.
   * Environment variable validation via Zod in `src/config/env.ts`.
   * Request logging with PII sanitization in `src/middlewares/requestLogger.ts` & `src/config/logger.ts`.
   * Centralized error handling mapping Prisma errors to HTTP codes (`P2002` -> `409 Conflict`, `P2025` -> `404 Not Found`).
   * Safe health check endpoint at `/health` and `/api/v1/health` with database heartbeat.
   * Dual-tier rate limiting for global requests and sensitive authentication endpoints.

3. **Data Layer (MySQL & Prisma):**
   * Multi-tenant relational schema with 9 core models (`Hospital`, `User`, `StaffProfile`, `Department`, `Doctor`, `DoctorAvailability`, `Patient`, `Appointment`, `AuditLog`).
   * Initial migration generated in `prisma/migrations/20261013000000_init/migration.sql`.
   * Concurrency-safe atomic transactions preventing appointment double-booking.

4. **Security & Authentication:**
   * Password hashing with `bcryptjs` (12 rounds).
   * Dual session token delivery: Bearer token and HTTP-only, secure, SameSite cookie.
   * Granular RBAC (`requireRole`) supporting 7 user roles.
   * Multi-tenant isolation (`enforceHospitalScope`) rejecting cross-hospital queries.
   * Automated security audit logging in `src/services/audit.service.ts`.
   * Chief Administrator onboarding script in `src/scripts/seedAdmin.ts`.

5. **Automated Verification:**
   * 29 comprehensive tests across 7 test suites passing with 100% success rate.
   * TypeScript builds to `dist/` with 0 compiler errors.

---

## 3. Staged Frontend Migration Strategy (Phase 2 Roadmap)

To safely transition the frontend without downtime:
1. **Step 1 (API Client):** Install `axios` or use native `fetch` with TanStack Query in `mainframe/`.
2. **Step 2 (Auth Adapter):** Update `mainframe/src/auth/AuthContext.tsx` to call `/api/v1/auth/login` and `/api/v1/auth/me`. If backend returns `200`, populate React session state. Keep Firebase as secondary fallback during trial period.
3. **Step 3 (Booking Form):** Update `mainframe/src/appointment/storage.ts` to POST to `/api/v1/appointments` instead of Firestore/localStorage.
4. **Step 4 (Admin Portal):** Replace direct Firestore snapshot listeners with TanStack Query polling `/api/v1/appointments` and `/api/v1/admin/metrics`.
5. **Step 5 (Cleanup):** Remove Firebase dependencies once all traffic flows through the backend API.
