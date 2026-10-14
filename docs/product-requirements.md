# HospitalX — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved & Implemented Foundation  
**Target Platform:** HospitalX Commercial Healthcare & Multi-Tenant Hospital Management Platform  
**Date:** October 2026  

---

## 1. Product Vision & Objectives

HospitalX transforms single-facility clinic workflows into a commercial, multi-tenant hospital-management platform. It provides an enterprise foundation supporting clinical staff, administration, receptionists, billing personnel, and patients across healthcare networks.

### Core Objectives:
1. **Multi-Tenancy & Data Isolation:** Multiple hospitals or clinics operate securely within an isolated tenant boundary (`hospitalId`), ensuring zero cross-tenant data leakage.
2. **Clinical Reliability & Concurrency Safety:** Appointment booking eliminates double-booking through atomic server-side transaction constraints.
3. **Enterprise Role-Based Access Control (RBAC):** Seven discrete personas with granular permission checks enforced at the API layer.
4. **Regulatory & Audit Readiness:** Immutable security audit logging tracking all sensitive operations (logins, staff permission changes, patient record modifications, appointment transitions).
5. **Zero-Disruption Frontend Coexistence:** Preserves the existing React 19 frontend while providing standard REST APIs (`/api/v1`) for gradual migration.

---

## 2. User Personas & Workflows

| Persona | Primary Capabilities & Permissions |
| :--- | :--- |
| **Super Administrator (`SUPER_ADMIN`)** | Global cross-hospital management, tenant provisioning, system health monitoring, unrestricted audit inspection. |
| **Hospital Administrator (`HOSPITAL_ADMIN`)** | Hospital profile & settings management, staff onboarding/offboarding, department creation/management, doctor credentialing, dashboard analytics, audit logs. |
| **Doctor / Specialist (`DOCTOR`)** | Assigned patient consultation queue, clinical appointment review, weekly availability schedule configuration, profile bio/fee management. |
| **Nurse (`NURSE`)** | Patient queue review, triage support, patient intake details updates. |
| **Receptionist (`RECEPTIONIST`)** | Walk-in patient registration, scheduling consultations, rescheduling, check-in status updates, patient record directory search. |
| **Billing Specialist (`BILLING`)** | Invoice verification, financial reporting, appointment status reconciliation. |
| **Patient (`PATIENT`)** | Self-service registration (automatic MRN allocation), doctor availability browsing, consultation booking, personal appointment rescheduling/cancellation, personal profile review. |

---

## 3. Key Functional Requirements

### 3.1 Authentication & Session Management
* Secure password hashing with `bcryptjs` (work factor 12).
* Hybrid session delivery: Signed JSON Web Tokens (`Bearer <JWT>`) and HTTP-Only, Secure, SameSite cookies (`access_token`).
* Self-service patient intake with automatic Medical Record Number (`MRN-YYYY-XXXXXX`) issuance.
* Brute-force rate limiting on auth endpoints (20 attempts per 15 minutes).

### 3.2 Clinical Departments & Doctor Rosters
* Hospital-scoped department management (unique code and name per hospital).
* Specialist doctor profiles linked to clinical departments and optional user accounts.
* Flexible weekly availability slots (`dayOfWeek`, `startTime`, `endTime`, `slotDurationMinutes`).

### 3.3 Appointment Scheduling & Concurrency Safety
* Outpatient consultation booking with visit type selection (`IN_PERSON` vs. `TELEHEALTH`).
* Atomic double-booking prevention rejecting conflicting bookings on `(hospitalId, doctorId, appointmentDate, startTime)`.
* Rescheduling workflow validating target slot availability before committing changes.
* Cancellation workflow requiring structured cancellation reasons.
* Status lifecycle: `PENDING` -> `CONFIRMED` -> `COMPLETED` / `CANCELLED` / `NO_SHOW` / `REJECTED`.

### 3.4 Governance & Audit Trail
* Automated capture of actor ID, IP address, user agent, target entity, and timestamp.
* PII and credential redaction before persisting audit metadata.
* Non-blocking logging pattern to guarantee primary transaction availability.
