# HospitalX — Frontend Architecture Specification

**Version:** 1.0.0  
**Stack:** React 19 + TypeScript + Vite 8 + TailwindCSS + Lucide React  
**Base Directory:** `mainframe/`  
**API Integration:** Fully typed API client (`src/lib/api.ts`) connecting to Express `/api/v1` backend

---

## 1. Architectural Philosophy

HospitalX Frontend follows a **Dual-Surface Architecture**:

1. **Public Marketing & Patient Onboarding Surface (`/`, `/about`, `/departments`, `/doctors`, `/appointments`, `/book-appointment`)**:
   - Modern, high-conversion healthcare presentation.
   - Doctor directory and booking wizards with real-time slot selection.
   - Public authentication (`/login`, `/register`).
   - Legacy classic admin gateway preserved (`/admin`).

2. **Enterprise Healthcare SaaS Operational Portal (`/app`)**:
   - Protected layout (`src/layouts/PortalLayout.tsx`) guarded by `useAuth()`.
   - Multi-tenant facility header showing live backend connection telemetry, current tenant identifier, and user role.
   - Persistent in-app notifications bell with real-time unread badges and acknowledgment dropdown.
   - Dynamic role-gated navigation for all operational workflows:
     - **Operational Dashboard (`/app`)**
     - **Appointments Queue (`/app/appointments`)**
     - **Patient Directory & EHR Dossiers (`/app/patients`)**
     - **Clinical Records & Consultations (`/app/clinical`)**
     - **Prescriptions Management (`/app/prescriptions`)**
     - **Billing & Invoices (`/app/billing`)**
     - **Specialist Roster (`/app/doctors`)**
     - **Doctor Availability Schedules (`/app/schedules`)**
     - **Clinical Divisions & Departments (`/app/departments`)**
     - **Staff Governance (`/app/staff`)**
     - **Security Audit Trail (`/app/audit-logs`)**
     - **Hospital Facility Settings (`/app/settings`)**

---

## 2. Directory Structure

```
mainframe/
├── src/
│   ├── auth/                      # Authentication context, provider, token storage
│   │   ├── AuthContext.tsx
│   │   └── index.ts
│   ├── components/
│   │   ├── portal/                # Enterprise UI design system components
│   │   │   ├── Badge.tsx          # Status badges (brand, success, warning, danger, neutral)
│   │   │   ├── Button.tsx         # Buttons with variants and loading spinners
│   │   │   ├── Card.tsx           # Standardized clinical card surfaces
│   │   │   ├── DataTable.tsx      # Paginated tables with search & sorting
│   │   │   ├── EmptyState.tsx     # Zero-data and filtered-out state placeholders
│   │   │   ├── ErrorBoundary.tsx  # React error boundaries catching runtime issues
│   │   │   ├── Input.tsx          # Accessible form inputs
│   │   │   ├── Modal.tsx          # Accessible dialogs with escape/backdrop dismiss
│   │   │   └── Select.tsx         # Standardized select dropdowns
│   │   └── TopScrollProgress.tsx
│   ├── layouts/
│   │   └── PortalLayout.tsx       # Hospital SaaS master layout with sidebar & notifications
│   ├── lib/
│   │   └── api.ts                 # Strongly typed fetch client connecting to `/api/v1`
│   ├── pages/
│   │   ├── portal/                # All authenticated hospital management views
│   │   │   ├── AppointmentsView.tsx
│   │   │   ├── AuditLogsView.tsx
│   │   │   ├── BillingView.tsx
│   │   │   ├── ClinicalRecordsView.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── DepartmentsView.tsx
│   │   │   ├── DoctorScheduleView.tsx
│   │   │   ├── DoctorsView.tsx
│   │   │   ├── PatientsView.tsx
│   │   │   ├── PrescriptionsView.tsx
│   │   │   ├── SettingsView.tsx
│   │   │   └── StaffView.tsx
│   │   └── HomePage.tsx
│   ├── App.tsx                    # React router routes & animated page transitions
│   └── main.tsx
```

---

## 3. Key Design Patterns

- **No Mock Data in Portal:** All portal views pull real, multi-tenant scoped data from the Express backend via `api.*` methods.
- **Server-Authoritative Calculations:** Invoicing views preview calculations locally for user feedback, but enforce server calculation upon POST.
- **Concurrency & Double Booking Safeguards:** Appointment scheduling handles `409 Conflict` gracefully and displays server conflict details.
- **Clinical Records Immutability:** Finalized consultation records cannot be edited in the UI or backend; the UI displays locked state badges.
- **Role-Based Navigation:** Navigation items and actions (e.g. creating prescriptions, managing staff) are rendered conditionally based on `currentUser.role`.
