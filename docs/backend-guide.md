# HospitalX — Backend Developer & Operations Guide

**System:** HospitalX Commercial Hospital Management Platform  
**Architecture:** Node.js (v24), Express.js (v4), TypeScript (v5), Prisma ORM (v6), MySQL (v8)  
**API Version:** `/api/v1`  
**Date:** October 2026  

---

## 1. Quick Start & Setup

### Prerequisites
* **Node.js:** v20.x or higher (tested on Node v24.18.0)
* **npm:** v10.x or higher (tested on npm 11.16.0)
* **MySQL:** MySQL Server v8.0+ or MariaDB v10.5+

### Installation & Build
```bash
# From workspace root:
npm install --prefix backend

# Build TypeScript to dist/
npm run build:backend

# Or from within the backend directory:
cd backend
npm install
npm run build
```

---

## 2. Environment Configuration

All environment variables are validated at startup using Zod schemas in `backend/src/config/env.ts`. If any variable is missing or malformed, the server halts with a clear error without leaking credentials.

Copy `.env.example` to `.env` inside `backend/`:
```bash
cd backend
cp .env.example .env
```

### Environment Variables Reference

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `4000` | Port on which Express API server listens. |
| `NODE_ENV` | Enum | `development` | Environment mode (`development`, `production`, `test`). |
| `DATABASE_URL` | String | `mysql://...` | Connection URI for MySQL database (`mysql://user:pass@host:3306/db`). |
| `JWT_SECRET` | String | *Min 16 chars* | Cryptographic secret for signing session JWT tokens. |
| `JWT_EXPIRES_IN`| String | `24h` | Token expiration duration (e.g., `24h`, `7d`). |
| `CORS_ORIGIN` | String | `http://localhost:5173` | Allowed frontend client origin. |
| `RATE_LIMIT_WINDOW_MS` | Number | `900000` (15m) | Global rate limit rolling window in milliseconds. |
| `RATE_LIMIT_MAX` | Number | `200` | Maximum requests per IP per window. |
| `DEFAULT_HOSPITAL_CODE` | String | `HOSP-CENTRAL-01` | Default tenant hospital code. |
| `DEFAULT_HOSPITAL_NAME` | String | `HospitalX Central Memorial Hospital` | Default hospital display name. |

---

## 3. Database Management & Migrations

The database is managed with Prisma ORM targeting MySQL with multi-tenant isolation.

### 1. Validate Schema
```bash
cd backend
npm run prisma:validate  # or: npx prisma validate
```

### 2. Generate Prisma Client
```bash
cd backend
npm run prisma:generate  # or: npx prisma generate
```

### 3. Run Migrations (Development)
```bash
cd backend
npm run prisma:migrate   # or: npx prisma migrate dev
```

### 4. Deploy Migrations (Production/CI)
```bash
cd backend
npm run prisma:deploy    # or: npx prisma migrate deploy
```

### 5. Provision Initial Hospital & Chief Administrator
To provision the initial hospital, default clinical departments, and chief admin account safely without hardcoding production credentials:
```bash
cd backend
ADMIN_EMAIL="admin@hospitalx.org" ADMIN_PASSWORD="YourSecurePasswordHere!" npm run seed:admin
```

---

## 4. API Endpoints Reference (`/api/v1`)

### 4.1 System & Health
* `GET /health` or `GET /api/v1/health`  
  * Returns system health and database heartbeat.  
  * Status: `200` (healthy) or `503` (degraded). Never exposes database connection strings or stack traces.

### 4.2 Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/login` — Login with email, password, and optional `hospitalCode`. Sets HTTP-only `access_token` cookie and returns Bearer token.
* `POST /api/v1/auth/register` — Self-registration for patients. Generates unique Medical Record Number (`MRN-YYYY-XXXXXX`).
* `POST /api/v1/auth/logout` — Revokes session and clears HTTP-only cookie.
* `GET /api/v1/auth/me` — Returns authenticated user profile, role, hospital scope, and role profile.

### 4.3 Hospital Governance (`/api/v1/hospitals`)
* `GET /api/v1/hospitals/current` — Returns current tenant hospital profile and resource counts.
* `PATCH /api/v1/hospitals/settings` — Updates hospital metadata (Admin only).

### 4.4 Staff & Personnel (`/api/v1/staff`)
* `GET /api/v1/staff?page=1&limit=20&role=DOCTOR` — Lists staff members (Admin only).
* `POST /api/v1/staff` — Creates staff account (Doctor, Nurse, Receptionist, Billing) (Admin only).
* `PATCH /api/v1/staff/:id` — Updates staff profile (Admin only).
* `PATCH /api/v1/staff/:id/status` — Updates status (`ACTIVE`, `INACTIVE`, `SUSPENDED`) (Admin only).

### 4.5 Clinical Departments (`/api/v1/departments`)
* `GET /api/v1/departments` — Lists active departments (All authenticated users).
* `POST /api/v1/departments` — Creates department (Admin only).
* `PATCH /api/v1/departments/:id` — Updates department (Admin only).
* `PATCH /api/v1/departments/:id/status` — Toggles active/inactive status (Admin only).

### 4.6 Doctors & Availability (`/api/v1/doctors`)
* `GET /api/v1/doctors?departmentId=&search=` — Lists doctors with availability (Public to hospital users).
* `GET /api/v1/doctors/:id` — Retrieves doctor details and active consultation slots.
* `POST /api/v1/doctors` — Creates doctor profile (Admin only).
* `PATCH /api/v1/doctors/:id` — Updates doctor bio, fee, specialty (Admin / Doctor).
* `GET /api/v1/doctors/:id/availability` — Lists active weekly schedule slots.
* `PUT /api/v1/doctors/:id/availability` — Replaces weekly availability slots (Admin / Doctor).

### 4.7 Patients (`/api/v1/patients`)
* `GET /api/v1/patients?page=1&search=` — Lists patients with masked medical details (Staff only; Patients forbidden).
* `GET /api/v1/patients/:id` — Retrieves patient record (Staff, or Patient self-view).
* `POST /api/v1/patients` — Manual front-desk patient intake (Receptionist / Nurse / Admin).
* `PATCH /api/v1/patients/:id` — Updates patient contact & demographics (Staff, or Patient self-update).

### 4.8 Appointments & Scheduling (`/api/v1/appointments`)
* `GET /api/v1/appointments?date=&status=&doctorId=` — Lists appointments (Role-filtered: patients see only their own, doctors see assigned, staff see hospital queue).
* `POST /api/v1/appointments` — Books consultation. **Concurrency-safe double-booking prevention** stops conflicting doctor slots.
* `PATCH /api/v1/appointments/:id/reschedule` — Moves appointment to a new date/time with conflict validation.
* `PATCH /api/v1/appointments/:id/cancel` — Cancels appointment with mandatory cancellation reason.
* `PATCH /api/v1/appointments/:id/status` — Status transition (`CONFIRMED`, `COMPLETED`, `NO_SHOW`, `REJECTED`) (Staff only).
* `GET /api/v1/appointments/:id` — Retrieves full appointment details.

### 4.9 Administration & Audit Logs (`/api/v1/admin`)
* `GET /api/v1/admin/metrics` — Dashboard KPI counts (Appointments by status, patients, doctors, departments, recent logs).
* `GET /api/v1/admin/audit-logs?page=1&action=&entity=` — Paginated security audit trail (Admin only).

---

## 5. Security & Authentication Architecture

1. **Password Security:**
   * Hashed via `bcryptjs` using 12 salt rounds.
   * `passwordHash` is excluded from all Prisma `select` queries and API serialization.
2. **Session Delivery:**
   * Hybrid JWT architecture: Returned as JSON Bearer token and simultaneously written to an HTTP-Only, Secure, SameSite cookie (`access_token`).
3. **Role-Based Authorization (RBAC):**
   * Express middleware `requireRole([UserRole.HOSPITAL_ADMIN, ...])`.
   * Roles are validated strictly from signed JWT payloads verified against the database.
   * `SUPER_ADMIN` holds system-wide override privileges.
4. **Tenant Isolation:**
   * Middleware `enforceHospitalScope` checks all parameters against the authenticated user's `hospitalId`.
   * All Prisma queries include `{ hospitalId: req.user.hospitalId }` in `where` clauses.
5. **Double-Booking Prevention:**
   * Concurrency-safe transactions (`prisma.$transaction`) atomically query for active appointments on `(hospitalId, doctorId, appointmentDate, startTime)` before writing, returning `409 Conflict` if a clash is detected.

---

## 6. Automated Testing Suite

HospitalX uses **Vitest** for backend unit and integration testing.

Run all tests:
```bash
# From workspace root:
npm run test:backend

# Or from backend/:
cd backend
npm test
```

### Verified Test Cases (29 Tests in 7 Suites):
* `tests/app.test.ts` — Server startup, 200/503 health check, 404 handler, malformed JSON handling, Prisma P2002 (409 Conflict) and P2025 (404 Not Found) error mapping.
* `tests/env.test.ts` — Zod environment schema validation, invalid port and key rejections.
* `tests/auth.test.ts` — Valid login, password verification, 401 on missing/tampered token, 400 on bad payload, hash secrecy.
* `tests/rbac.test.ts` — 403 on patient attempting admin actions, 403 on staff cross-role violation, cross-hospital tenant rejection.
* `tests/department_doctor.test.ts` — Department CRUD, duplicate code conflict (409), doctor creation under missing dept (404), availability slot updates.
* `tests/patient.test.ts` — Patient list restriction from ordinary patients, cross-patient profile access block (403), receptionist access.
* `tests/appointment.test.ts` — Booking flow, concurrent double-booking conflict rejection (409), appointment rescheduling, rescheduling conflict rejection (409), cancelled appointment state checks (400), cancellation with reason.

---

## 7. Known Limitations & Next Steps

1. **MySQL Daemon:** Local development requires a running MySQL instance (Docker or local service) configured in `.env`.
2. **Frontend Migration:** The frontend currently runs against Firebase/localStorage. In the next phase, frontend API services should be connected to `/api/v1` via Axios or TanStack Query.
3. **Real-Time Push:** Live queue updates currently rely on polling; future milestones will add WebSocket or Server-Sent Events (SSE) for nurse triage stations.
