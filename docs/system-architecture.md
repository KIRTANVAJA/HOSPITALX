# HospitalX — System Architecture Document

**Document Version:** 1.0.0  
**Status:** Approved & Implemented  
**Date:** October 2026  

---

## 1. High-Level Architecture Overview

HospitalX employs a decoupled multi-tier architecture separating the client presentation layer from the core business logic, API validation pipeline, and relational database:

```mermaid
graph TD
    subgraph Client Tier [Frontend Layer]
        A[React 19 SPA (Vite / Tailwind v4)]
        B[Hospital Admin Portal]
        C[Patient Self-Service Wizard]
    end

    subgraph Gateway & Middleware Tier [Express API Layer /api/v1]
        D[Helmet & Security Headers]
        E[CORS & Credentials Handler]
        F[Request Logger & Timing]
        G[Rate Limiters: API & Auth]
        H[Authentication & JWT / Cookie Parser]
        I[RBAC & Hospital Scope Enforcement]
        J[Zod Request Validation]
    end

    subgraph Service Tier [Domain Business Logic]
        K[Auth & Identity Service]
        L[Hospital Service]
        M[Staff Service]
        N[Department Service]
        O[Doctor & Availability Service]
        P[Patient Service]
        Q[Appointment Scheduling Engine]
        R[Admin & Metrics Service]
        S[Audit Logging Engine]
    end

    subgraph Data Tier [Persistence Layer]
        T[Prisma ORM Client v6]
        U[(MySQL Database v8)]
        V[(Audit Logs Table)]
    end

    Client Tier -->|HTTPS / JSON + Cookie| Gateway & Middleware Tier
    Gateway & Middleware Tier --> Service Tier
    Service Tier --> T
    T --> U
    S --> V
```

---

## 2. Architectural Principles & Patterns

### 2.1 Multi-Tenant Isolation
* Every table belonging to clinical and operational workflows includes `hospitalId`.
* Tenant context is extracted from the cryptographically verified JWT payload and checked by `enforceHospitalScope` middleware.
* Queries explicitly append `{ hospitalId: req.user.hospitalId }` in the Prisma `where` clause to prevent cross-tenant data traversal.

### 2.2 Concurrency-Safe State Transitions
* Appointment operations (booking, rescheduling) operate within `prisma.$transaction(async (tx) => { ... })`.
* Slots are queried atomically for existing active reservations before inserting or updating.
* Compound indices on `(hospitalId, doctorId, appointmentDate, startTime, status)` ensure conflict checks execute in single-digit milliseconds.

### 2.3 Layered Error Handling & Response Normalization
* Standardized application errors (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`).
* Unified JSON response envelopes:
  * Success: `{ "success": true, "data": ..., "meta": ... }`
  * Error: `{ "success": false, "error": { "message": "...", "statusCode": ..., "details": ... } }`
* Prisma error translation mapping known engine error codes (`P2002` -> `409 Conflict`, `P2025` -> `404 Not Found`).

### 2.4 Graceful Process Lifecycle
* Signals (`SIGTERM`, `SIGINT`) trigger controlled HTTP connection draining and orderly Prisma database pool closure before process termination.
