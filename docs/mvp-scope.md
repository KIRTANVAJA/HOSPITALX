# HospitalX — Minimum Viable Product (MVP) Scope

**Document Version:** 1.0.0  
**Status:** Approved & Implemented  
**Date:** October 2026  

---

## 1. MVP In-Scope Modules

The MVP backend delivers the complete multi-tenant healthcare foundation required to replace client-side persistence and power a secure hospital operation:

### 1.1 Multi-Tenant Core & Hospital Governance
- Multi-hospital tenant data model.
- Hospital metadata & administrative settings endpoints (`GET /hospitals/current`, `PATCH /hospitals/settings`).
- Chief Administrator bootstrapping script (`seedAdmin.ts`) for zero-manual-touch initial hospital provisioning.

### 1.2 Enterprise Authentication & RBAC
- Local account registration for patients and admin-provisioned accounts for hospital staff.
- Session termination with cookie revocation (`POST /auth/logout`).
- Current authenticated user resolution with full role profile extensions (`GET /auth/me`).
- Strict role checking (`requireRole`) and hospital boundary checks (`enforceHospitalScope`).

### 1.3 Staff & Clinical Personnel
- Staff account provisioning across 6 staff roles (`POST /staff`).
- Staff listing with role filtering and pagination (`GET /staff`).
- Staff profile and operational status modification (`PATCH /staff/:id`, `PATCH /staff/:id/status`).

### 1.4 Clinical Departments
- Department listing with active/inactive filtering (`GET /departments`).
- Department creation, modification, and activation status management (`POST /departments`, `PATCH /departments/:id`, `PATCH /departments/:id/status`).

### 1.5 Doctors & Consultation Availability
- Doctor directory with department filtering and text search (`GET /doctors`).
- Doctor profile detail retrieval with active schedule inspection (`GET /doctors/:id`).
- Doctor creation and bio/fee updating (`POST /doctors`, `PATCH /doctors/:id`).
- Weekly availability schedule configuration (`GET /doctors/:id/availability`, `PUT /doctors/:id/availability`).

### 1.6 Patient Directory & Electronic Demographics
- Staff-managed patient registration (`POST /patients`).
- Paginated patient listing with name/phone/MRN search (`GET /patients`).
- Personal patient record viewing and self-updates (`GET /patients/:id`, `PATCH /patients/:id`).

### 1.7 Concurrency-Safe Appointment Management
- Appointment booking with conflict rejection (`POST /appointments`).
- Appointment list filtering by date, doctor, status, and patient (`GET /appointments`).
- Atomic appointment rescheduling with clash validation (`PATCH /appointments/:id/reschedule`).
- Structured appointment cancellation (`PATCH /appointments/:id/cancel`).
- Staff clinical status updates (`PATCH /appointments/:id/status`).

### 1.8 Administration & Security Audit Trail
- Executive KPI dashboard counts (`GET /admin/metrics`).
- Paginated security audit trail with date range, action, and entity filtering (`GET /admin/audit-logs`).

---

## 2. Explicitly Out-of-Scope (Post-MVP Milestones)

To ensure focused delivery of the critical backend foundation, the following enterprise capabilities are scheduled for Phase 2:
1. **Live WebRTC Telehealth Streaming:** Full video/audio room signaling.
2. **Payment Gateway Integration:** Direct Stripe/PayPal credit card processing.
3. **Inpatient Bed Management:** Ward floor visualizer and inpatient bed assignment.
4. **Pharmacy Inventory Management:** Drug stock batch tracking and automated dispensary alerts.
5. **Direct EMR / HL7 / FHIR Integration:** Ingestion pipelines for legacy hospital feeds.
