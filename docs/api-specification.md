# HospitalX — REST API Specification (`/api/v1`)

**Document Version:** 1.0.0  
**Base URL:** `http://localhost:4000/api/v1`  
**Data Format:** JSON (`application/json`)  
**Date:** October 2026  

---

## 1. Response Protocol & Error Envelope

All responses adhere to standardized JSON envelopes:

### Success Response:
```json
{
  "success": true,
  "message": "Optional descriptive success message",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "statusCode": 400,
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1 System & Health Check
* `GET /health` or `GET /api/v1/health`
  * **Auth:** Public
  * **Success:** `200 OK` (Healthy), `503 Service Unavailable` (Degraded)
  * **Payload:** `{ "status": "healthy", "services": { "database": "connected" } }`

---

### 2.2 Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/login`
  * **Auth:** Public (Rate limited: 20 req / 15 min)
  * **Body:** `{ "email": "user@hospitalx.org", "password": "...", "hospitalCode": "HOSP-CENTRAL-01" }`
  * **Cookie Set:** `access_token` (HTTP-Only, Secure in prod, SameSite)
  * **Success:** `200 OK` with token and user object.

* `POST /api/v1/auth/register`
  * **Auth:** Public (Self-registration for patients)
  * **Body:** `{ "email": "patient@mail.com", "password": "...", "firstName": "...", "lastName": "...", "phone": "..." }`
  * **Success:** `201 Created` with generated `mrN` and session.

* `POST /api/v1/auth/logout`
  * **Auth:** Authenticated
  * **Action:** Clears `access_token` cookie, records `AUTH_LOGOUT` audit log.
  * **Success:** `200 OK`.

* `GET /api/v1/auth/me`
  * **Auth:** Authenticated
  * **Success:** `200 OK` with profile, role, hospital context, and role-extension profiles.

---

### 2.3 Hospital Context & Settings (`/api/v1/hospitals`)
* `GET /api/v1/hospitals/current`
  * **Auth:** Authenticated
  * **Success:** `200 OK` with hospital metadata and resource counts.

* `PATCH /api/v1/hospitals/settings`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "name": "...", "address": "...", "phone": "...", "email": "..." }`
  * **Success:** `200 OK`.

---

### 2.4 Staff Personnel Management (`/api/v1/staff`)
* `GET /api/v1/staff?page=1&limit=20&role=DOCTOR`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Success:** `200 OK` with paginated staff records.

* `POST /api/v1/staff`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "email": "...", "password": "...", "firstName": "...", "lastName": "...", "role": "DOCTOR", "employeeId": "EMP-100" }`
  * **Success:** `201 Created`.

* `PATCH /api/v1/staff/:id`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "firstName": "...", "jobTitle": "...", "department": "..." }`
  * **Success:** `200 OK`.

* `PATCH /api/v1/staff/:id/status`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "status": "SUSPENDED" }`
  * **Success:** `200 OK`.

---

### 2.5 Clinical Departments (`/api/v1/departments`)
* `GET /api/v1/departments?includeInactive=false`
  * **Auth:** All authenticated roles
  * **Success:** `200 OK`.

* `POST /api/v1/departments`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "name": "Cardiology", "code": "CARDIO", "description": "..." }`
  * **Success:** `201 Created` (`409 Conflict` if duplicate code/name).

* `PATCH /api/v1/departments/:id`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Success:** `200 OK`.

* `PATCH /api/v1/departments/:id/status`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "isActive": false }`
  * **Success:** `200 OK`.

---

### 2.6 Doctors & Availability Schedules (`/api/v1/doctors`)
* `GET /api/v1/doctors?departmentId=&search=&includeInactive=false`
  * **Auth:** All authenticated roles
  * **Success:** `200 OK` with doctor cards and active schedule hours.

* `GET /api/v1/doctors/:id`
  * **Auth:** All authenticated roles
  * **Success:** `200 OK` with detailed profile and availability slots.

* `POST /api/v1/doctors`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "name": "...", "departmentId": "...", "specialty": "...", "licenseNumber": "MD-..." }`
  * **Success:** `201 Created`.

* `PATCH /api/v1/doctors/:id`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`, `DOCTOR`
  * **Success:** `200 OK`.

* `GET /api/v1/doctors/:id/availability`
  * **Auth:** All authenticated roles
  * **Success:** `200 OK`.

* `PUT /api/v1/doctors/:id/availability`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`, `DOCTOR`
  * **Body:** `{ "availabilities": [{ "dayOfWeek": 1, "startTime": "09:00", "endTime": "12:00", "slotDurationMinutes": 30 }] }`
  * **Success:** `200 OK`.

---

### 2.7 Patients (`/api/v1/patients`)
* `GET /api/v1/patients?page=1&search=`
  * **Auth:** Clinical & Administrative Staff (Patients rejected with `403 Forbidden`)
  * **Success:** `200 OK` with masked patient list.

* `GET /api/v1/patients/:id`
  * **Auth:** Staff (all patients) or Patient (self-record only; others rejected with `403`)
  * **Success:** `200 OK` with full demographics and recent appointment history.

* `POST /api/v1/patients`
  * **Auth:** Staff (`RECEPTIONIST`, `NURSE`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`)
  * **Body:** `{ "firstName": "...", "lastName": "...", "phone": "...", "bloodGroup": "..." }`
  * **Success:** `201 Created` with allocated MRN.

* `PATCH /api/v1/patients/:id`
  * **Auth:** Staff or Patient (own profile)
  * **Success:** `200 OK`.

---

### 2.8 Appointments & Scheduling (`/api/v1/appointments`)
* `GET /api/v1/appointments?date=&doctorId=&status=&patientId=`
  * **Auth:** Role-filtered:
    * `PATIENT`: Filtered strictly to logged-in user's appointments.
    * `DOCTOR`: Filtered strictly to attending doctor's queue.
    * `STAFF`: Facility-wide view.
  * **Success:** `200 OK`.

* `POST /api/v1/appointments`
  * **Auth:** `PATIENT`, `RECEPTIONIST`, `NURSE`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "doctorId": "...", "departmentId": "...", "appointmentDate": "2026-10-25", "startTime": "10:00", "visitType": "IN_PERSON" }`
  * **Success:** `201 Created` (`409 Conflict` if slot already booked).

* `PATCH /api/v1/appointments/:id/reschedule`
  * **Auth:** Staff or Patient (own appointment)
  * **Body:** `{ "appointmentDate": "2026-10-26", "startTime": "11:00", "reason": "..." }`
  * **Success:** `200 OK` (`409 Conflict` if new slot unavailable, `400 Bad Request` if cancelled/completed).

* `PATCH /api/v1/appointments/:id/cancel`
  * **Auth:** Staff or Patient (own appointment)
  * **Body:** `{ "cancellationReason": "Mandatory explanation" }`
  * **Success:** `200 OK`.

* `PATCH /api/v1/appointments/:id/status`
  * **Auth:** Clinical & Administrative Staff
  * **Body:** `{ "status": "CONFIRMED", "notes": "..." }`
  * **Success:** `200 OK`.

* `GET /api/v1/appointments/:id`
  * **Auth:** Staff or Patient (own appointment)
  * **Success:** `200 OK`.

---

### 2.9 Administration & Audit Trail (`/api/v1/admin`)
* `GET /api/v1/admin/metrics`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Success:** `200 OK` with counts for appointments (total, pending, confirmed, completed, cancelled, today), resources (patients, doctors, departments, staff), and recent audit items.

* `GET /api/v1/admin/audit-logs?page=1&action=&entity=&startDate=&endDate=`
  * **Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Success:** `200 OK` with paginated security audit history.

---

### 2.10 Clinical Consultations & EHR (`/api/v1/clinical`)
* `GET /api/v1/clinical/consultations?page=1&limit=20&patientId=&doctorId=`
  * **Auth:** Clinical Staff & Patient (patient can only view their own consultations)
  * **Success:** `200 OK` with paginated consultation records, doctor & patient info, vital signs, prescriptions.

* `GET /api/v1/clinical/consultations/:id`
  * **Auth:** Authorized staff or Patient (own consultation)
  * **Success:** `200 OK`.

* `POST /api/v1/clinical/consultations`
  * **Auth:** `DOCTOR`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "patientId": "...", "doctorId": "...", "diagnosis": "...", "symptoms": "...", "examinationNotes": "...", "vitalSigns": { "bp": "120/80", "heartRate": 72 } }`
  * **Success:** `201 Created` with DRAFT consultation record.

* `PATCH /api/v1/clinical/consultations/:id`
  * **Auth:** Attending Doctor or Admins (`400 Bad Request` if consultation is already FINALIZED).
  * **Body:** `{ "diagnosis": "...", "symptoms": "...", "examinationNotes": "...", "vitalSigns": { ... } }`
  * **Success:** `200 OK`.

* `POST /api/v1/clinical/consultations/:id/finalize`
  * **Auth:** `DOCTOR`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Action:** Locks consultation into immutable `FINALIZED` status with timestamp.
  * **Success:** `200 OK`.

---

### 2.11 Prescriptions (`/api/v1/clinical/prescriptions`)
* `GET /api/v1/clinical/prescriptions?page=1&limit=20&patientId=&status=`
  * **Auth:** Clinical Staff & Patient (patients limited to their own prescriptions)
  * **Success:** `200 OK`.

* `POST /api/v1/clinical/prescriptions`
  * **Auth:** `DOCTOR`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "patientId": "...", "doctorId": "...", "consultationId": "...", "medications": [{ "name": "...", "dosage": "...", "frequency": "...", "duration": "...", "instructions": "..." }], "notes": "..." }`
  * **Success:** `201 Created` with ACTIVE status.

* `PATCH /api/v1/clinical/prescriptions/:id/status`
  * **Auth:** `DOCTOR`, `NURSE`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "status": "ACTIVE" | "DISCONTINUED" | "COMPLETED" }`
  * **Success:** `200 OK`.

---

### 2.12 Medical Reports (`/api/v1/clinical/reports`)
* `GET /api/v1/clinical/reports?page=1&limit=20&patientId=`
  * **Auth:** Clinical Staff & Patient (patients restricted to own reports)
  * **Success:** `200 OK`.

* `POST /api/v1/clinical/reports`
  * **Auth:** `DOCTOR`, `NURSE`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "patientId": "...", "title": "...", "reportType": "LAB_TEST" | "RADIOLOGY" | "PATHOLOGY" | "DISCHARGE_SUMMARY" | "OTHER", "fileUrl": "...", "mimeType": "...", "fileSize": 1024, "summary": "..." }`
  * **Success:** `201 Created`.

---

### 2.13 Billing & Financials (`/api/v1/billing`)
* `GET /api/v1/billing/invoices?page=1&limit=20&patientId=&status=`
  * **Auth:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `BILLING`, `RECEPTIONIST`, and `PATIENT` (own invoices)
  * **Success:** `200 OK` with line items and payment ledgers.

* `POST /api/v1/billing/invoices`
  * **Auth:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `BILLING`, `RECEPTIONIST`
  * **Body:** `{ "patientId": "...", "dueDate": "...", "tax": 10, "discount": 5, "lineItems": [{ "description": "...", "quantity": 1, "unitPrice": 100 }] }`
  * **Rule:** Subtotal and total strictly computed and rounded to 2 decimals on server.
  * **Success:** `201 Created` with auto-sequenced invoice number (`INV-YYYY-XXXXX`).

* `POST /api/v1/billing/invoices/:id/payments`
  * **Auth:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `BILLING`, `RECEPTIONIST`
  * **Body:** `{ "amount": 95, "paymentMethod": "CASH" | "CARD" | "INSURANCE" | "BANK_TRANSFER", "transactionRef": "..." }`
  * **Rule:** Amount cannot exceed remaining balance (`400 Bad Request`). Status transitions to `PARTIAL` or `PAID`.
  * **Success:** `201 Created`.

---

### 2.14 Notifications (`/api/v1/notifications`)
* `GET /api/v1/notifications?page=1&limit=20&unreadOnly=false`
  * **Auth:** Authenticated (scoped to user)
  * **Success:** `200 OK` with `notifications` array and `unreadCount`.

* `PATCH /api/v1/notifications/:id/read`
  * **Auth:** Authenticated (own notification)
  * **Success:** `200 OK`.

* `POST /api/v1/notifications/read-all`
  * **Auth:** Authenticated
  * **Success:** `200 OK`.

---

### 2.15 AI-Assisted Clinical Documentation (`/api/v1/ai`)
* `POST /api/v1/ai/summarize-consultation`
  * **Auth:** `DOCTOR`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
  * **Body:** `{ "consultationId": "...", "diagnosis": "...", "symptoms": "...", "examinationNotes": "...", "vitalSigns": { ... } }`
  * **Safety:** Mandates `aiGenerated: true`, `requiresPhysicianReview: true`, and standard disclaimer.
  * **Success:** `200 OK` with synthesis, key findings, and recommended follow-up timeframe.

