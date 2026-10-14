# HospitalX — Architecture Decision Records (ADR)

**Document Version:** 1.0.0  
**Project:** HospitalX Healthcare Management Platform  
**Date:** October 2026  

---

## ADR-001: Backend Foundation Stack (Node.js, Express, TypeScript, Prisma, MySQL)

### Context
The initial application was a 100% client-side React 19 application relying on direct browser Firestore reads/writes and browser `localStorage`. To transition into a commercial hospital-management platform supporting clinical staff, administrators, billing, and patients, a dedicated server and relational database are required.

### Decision
We established a dedicated `backend/` directory utilizing:
* **Node.js (v24 LTS)** with **Express.js (v4)**: Battle-tested enterprise runtime with predictable middleware pipelining.
* **TypeScript (v5)**: Shared type-safety across requests, responses, database entities, and middlewares.
* **MySQL (v8)** via **Prisma ORM (v6)**: Relational integrity, ACID transaction support, foreign key cascades, and automated schema migrations.
* **Zod (v3)**: Strict schema validation on all inputs (body, query, params, environment variables).

### Consequences
* Requires running a MySQL daemon for live data persistence.
* Provides a secure barrier between the public internet and medical database storage.
* Eliminates client-side database exposure.

---

## ADR-002: Multi-Tenant Architecture & Hospital-Scope Enforcement

### Context
Commercial hospital systems must support multi-tenant isolation so that records from Hospital A cannot be queried or tampered with by users from Hospital B.

### Decision
* Every core relational entity (`User`, `Department`, `Doctor`, `DoctorAvailability`, `Patient`, `Appointment`, `AuditLog`) carries a mandatory foreign key `hospitalId`.
* Middleware `enforceHospitalScope` checks all request parameters and prevents non-super-admins from specifying or querying outside their assigned `hospitalId`.
* Every service query explicitly includes `{ hospitalId: req.user.hospitalId }` in its `where` clause.

### Consequences
* Eliminates cross-tenant data leaks.
* Provides a foundation for future SaaS multi-hospital deployments.

---

## ADR-003: Concurrency-Safe Appointment Booking & Double-Booking Prevention

### Context
In outpatient medical scheduling, two patients or receptionists may attempt to book the same physician at the exact same time slot simultaneously. Client-side checks alone allow race conditions.

### Decision
* Appointment bookings and reschedules are wrapped in atomic database transactions (`prisma.$transaction`).
* Prior to creating a new appointment or updating an existing one, the transaction queries for existing active bookings (`status IN ['PENDING', 'CONFIRMED']`) on `(hospitalId, doctorId, appointmentDate, startTime)`.
* If a conflict is detected, the transaction immediately aborts and throws `409 ConflictError`.
* Indexed compound keys are placed on `(hospitalId, doctorId, appointmentDate, startTime, status)` for sub-millisecond conflict checks.

### Consequences
* Race conditions and conflicting bookings are mathematically eliminated at the database transaction layer.

---

## ADR-004: Dual-Channel Session Delivery & Firebase Coexistence

### Context
The existing React frontend currently uses Firebase Authentication and local storage. A sudden removal of Firebase would break the running frontend before its API client integration is complete.

### Decision
* We created a secure local backend authentication system without immediately disabling the frontend's Firebase client.
* Session tokens are delivered via both `Authorization: Bearer <JWT>` header and an **HTTP-Only, Secure, SameSite cookie** (`access_token`).
* This permits browser clients and external mobile/desktop API clients to authenticate seamlessly.
* Passwords are encrypted using `bcryptjs` with 12 salt rounds; plain passwords and hashes are strictly excluded from all API responses.

### Consequences
* The frontend continues to run without disruption.
* A clear, staged migration path is established to redirect frontend auth to `/api/v1/auth/login`.

---

## ADR-005: Workspace Root Unification Without Directory Disruption

### Context
The user repository had multiple nested folders (`mainframe/`, `we-care/`, `src/`, `about/`) and executing `npm run dev` in the root threw `ENOENT: no such file or directory, open package.json`.

### Decision
* We preserved all existing folders without moving or deleting frontend files.
* We created a unified `package.json` at the repository root with workspace scripts:
  * `"dev"` / `"dev:frontend"` -> runs `npm run dev --prefix mainframe`
  * `"dev:backend"` -> runs `npm run dev --prefix backend`
  * `"build"` -> compiles backend then frontend
  * `"test:backend"` -> executes backend Vitest test suite

### Consequences
* Root workspace commands (`npm run dev`, `npm run build`) execute cleanly without terminal errors.
* Existing frontend functionality remains completely untouched.

---

## ADR-006: Atomic Appointment Rescheduling & Conflict Re-Validation

### Context
When a patient or hospital staff reschedules an appointment to a new date and time, the new slot may already be reserved by another patient or physician. Allowing a direct update risks creating an unvalidated double-booking. Additionally, attempting to reschedule an appointment that has already been marked as `COMPLETED` or `CANCELLED` violates clinical workflow state machines.

### Decision
* All appointment rescheduling is executed within atomic `prisma.$transaction`.
* The transaction verifies that the appointment is in an active state (`PENDING` or `CONFIRMED`).
* The transaction performs an atomic conflict search for other active appointments on `(hospitalId, doctorId, appointmentDate, startTime, id: { not: currentAppointmentId })`.
* If a conflict is discovered, `409 ConflictError` is thrown, immediately rolling back the transaction.

### Consequences
* Rescheduled appointments cannot create slot collisions.
* Historic records (`COMPLETED`, `CANCELLED`) cannot be resurrected or overwritten.

---

## ADR-007: Prisma Database Error Translation & Credential Redaction

### Context
Prisma throws database engine exceptions (`PrismaClientKnownRequestError`) that expose internal column identifiers, constraint names, or raw SQL details if returned to clients.

### Decision
* The centralized `errorHandler` translates Prisma error codes into standard HTTP errors:
  * `P2002` (Unique constraint violation) -> `409 ConflictError` with sanitized field names.
  * `P2025` (Record not found) -> `404 NotFoundError`.
  * `P2003` (Foreign key violation) -> `400 BadRequestError`.
* Database connection URIs, passwords, and sensitive hospital infrastructure configurations are never leaked in error responses or logs.

### Consequences
* Protects database internals from reconnaissance attacks while providing clear, actionable error feedback to API consumers.

