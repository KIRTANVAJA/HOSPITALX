# HospitalX — Security Architecture & Access Control Model

**Document Version:** 1.0.0  
**Status:** Approved & Implemented  
**Date:** October 2026  

---

## 1. Security Architecture Principles

HospitalX is engineered for commercial healthcare deployments requiring strict regulatory compliance (HIPAA Security Rule, GDPR Art. 32). The security framework addresses vulnerabilities identified in the legacy frontend audit:

```
[Threat Boundary: Public Internet]
        │
   HTTPS (TLS 1.3)
   Helmet Security Headers
   Rate Limiting (Global & Auth Specific)
        │
[API Gateway: Express /api/v1]
        │
   JWT Authentication & HTTP-Only Secure Cookie Extraction
        │
   Role-Based Authorization Gate (requireRole)
        │
   Tenant Isolation Gate (enforceHospitalScope)
        │
   Zod Schema Validation & Sanitization (validateRequest)
        │
[Service Logic Tier: Concurrency-Safe Transactions]
        │
   Audit Logging (Sanitized, PII/Password Redacted)
        │
[Database Tier: MySQL (Prisma ORM)]
```

---

## 2. Authentication & Credential Storage

### 2.1 Password Storage & Encryption
* Plaintext passwords and client-computed hashes are rejected.
* All passwords are encrypted server-side using **bcryptjs** with a cost factor of **12 salt rounds**.
* `passwordHash` is excluded from all Prisma default `select` clauses and will never appear in API responses or logs.

### 2.2 Dual-Channel Session Delivery
* **Bearer Token:** Returned in the JSON body as `token` for headless clients, mobile apps, and automated test runners.
* **HTTP-Only Cookie:** Simultaneously issued as `access_token`:
  * `httpOnly: true` (prevents JavaScript/XSS extraction).
  * `secure: env.NODE_ENV === 'production'` (forces HTTPS transmission in production).
  * `sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax'` (prevents CSRF exploits).
  * `maxAge: 86400000` (24-hour expiration).

---

## 3. Role-Based Access Control (RBAC) Matrix

Every API route is protected by `requireRole([allowedRoles])`. The authenticated user's role is extracted from their cryptographically signed JWT.

| Module / Action | `SUPER_ADMIN` | `HOSPITAL_ADMIN` | `DOCTOR` | `NURSE` | `RECEPTIONIST` | `BILLING` | `PATIENT` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Health** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Hospital Settings** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Staff Accounts** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Departments** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Create/Update Doctors**| ✅ | ✅ | Own Bio | ❌ | ❌ | ❌ | ❌ |
| **Doctor Availability** | ✅ | ✅ | Own Sched | ❌ | ❌ | ❌ | ❌ |
| **List All Patients** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **View Patient Details** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Self Only |
| **Create Patient File** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Self Reg |
| **Book Appointments** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Self Only |
| **Reschedule/Cancel** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Self Only |
| **Update Appt Status** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Executive Metrics** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Security Audit Logs** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Multi-Tenant Isolation Model

1. **Relational Scope:**
   * Every core entity (`User`, `Department`, `Doctor`, `DoctorAvailability`, `Patient`, `Appointment`, `AuditLog`) enforces a foreign key link to `hospitalId`.
2. **Middleware Scope Enforcement:**
   * `enforceHospitalScope` intercepts all requests. If a non-super-admin user provides a `hospitalId` in parameters or query strings that differs from their JWT claim, the request immediately terminates with a `403 Forbidden` response.
3. **Query Boundary:**
   * Every database read and write explicitly binds `{ hospitalId: req.user.hospitalId }` in the query criteria.

---

## 5. Concurrency Safety & Anti-Double-Booking

* Medical consultation slots are critical shared resources.
* All booking and rescheduling actions run inside atomic database transactions (`prisma.$transaction`).
* The transaction executes an atomic conflict check querying for existing `PENDING` or `CONFIRMED` appointments for that `(hospitalId, doctorId, appointmentDate, startTime)`.
* Conflicting requests abort immediately with a `409 ConflictError`, mathematically eliminating race-condition double bookings.

---

## 6. Audit Logging & Non-Repudiation

* Security events are permanently recorded in the `audit_logs` table.
* **Tracked Events:**
  * `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_REGISTER_PATIENT`
  * `STAFF_CREATE`, `STAFF_UPDATE`, `STAFF_STATUS_CHANGE`
  * `HOSPITAL_SETTINGS_UPDATE`
  * `DEPARTMENT_CREATE`, `DEPARTMENT_UPDATE`, `DEPARTMENT_STATUS_CHANGE`
  * `DOCTOR_CREATE`, `DOCTOR_UPDATE`, `DOCTOR_AVAILABILITY_UPDATE`
  * `PATIENT_CREATE`, `PATIENT_UPDATE`
  * `APPOINTMENT_BOOK`, `APPOINTMENT_RESCHEDULE`, `APPOINTMENT_CANCEL`, `APPOINTMENT_STATUS_CHANGE`
* **PII Sanitization:** The logging engine automatically masks passwords, tokens, JWTs, credit card numbers, and authorization headers with `[REDACTED]`.
