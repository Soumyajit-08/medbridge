# MedBridge — Complete Integration & System Audit Report

**Date:** September 17, 2026  
**Auditor:** Senior Full-Stack & System Integration Engineering Team  
**Scope:** Complete End-to-End Audit of `frontend` (React + TypeScript + Vite) and `backend` (FastAPI + SQLAlchemy + PostgreSQL).

---

## 1. Existing Architecture Overview

- **Frontend:**
  - Single Page Application built with React 19, TypeScript, Tailwind CSS, TanStack React Query v5, Zustand, React Router DOM v7, Lucide Icons, and Axios.
  - Bundler: Vite 6.
  - Initial configuration had `VITE_MOCK_MODE=true` set in `.env.local`, which was routing browser network requests through Mock Service Worker (MSW) (`src/mocks/browser.ts` and `src/mocks/handlers.ts`).
  - MSW mocked several basic endpoints in-memory, but completely omitted several core features (such as `GET /donor/dashboard`, `GET /recipient/dashboard`, and real PostgreSQL persistence).
  - All frontend API calls are cleanly abstracted in `frontend/src/services/*.ts` through a centralized Axios client (`frontend/src/services/api.ts`).

- **Backend:**
  - Modern Python 3.12 FastAPI application structured into Clean Architecture / Layered Architecture:
    - `app/core`: Configuration (`config.py`), Constants (`constants.py`), Dependency Injection (`dependencies.py`).
    - `app/db`: Engine & Session (`database.py`, `session.py`), Base declarative metadata (`base.py`).
    - `app/models`: SQLAlchemy 2.0 ORM models.
    - `app/schemas`: Pydantic v2 schemas.
    - `app/repositories`: Data access layer.
    - `app/services`: Domain & Business logic layer.
    - `app/routers`: HTTP route controllers.
    - `app/utils`: Enums, custom exceptions, datetime, pagination.
  - Asynchronous / Celery / Redis worker folders (`app/workers/tasks`).
  - Database: PostgreSQL 18.4 running on port 5432 with `psycopg` driver v3.
  - Migrations: Alembic configured in `alembic.ini` and `alembic/env.py`.

---

## 2. Frontend & Backend Entry Points

- **Frontend Entry Point:**
  - `frontend/src/main.tsx`: Mounts React DOM root `#root`, conditionally enables MSW if `MOCK_MODE` is true, and wraps application with `StrictMode`.
  - `frontend/src/App.tsx`: Sets up `ErrorBoundary`, `HelmetProvider`, `QueryClientProvider`, `BrowserRouter`, `ToastContainer`, `useAuthInit()` hook, and public/protected routes.
  - Base Layouts: `PublicLayout`, `DonorLayout`, `RecipientLayout`, `AdminLayout`.

- **Backend Entry Point:**
  - `backend/app/main.py`: Creates FastAPI instance, configures CORS middleware with credentials support, registers MedBridge exception handlers, and mounts routers with `/api/v1` prefix.
  - ASGI Server: `uvicorn app.main:app --reload --port 8000`.
  - OpenAPI Swagger: `/docs`, ReDoc: `/redoc`, OpenAPI JSON: `/openapi.json`.

---

## 3. API Base URL & Network Configuration

- **Frontend Base URL:**
  - Configured in `frontend/src/lib/constants.ts`:
    `export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';`
  - Axios instance in `frontend/src/services/api.ts` uses `baseURL: API_BASE_URL` and `withCredentials: true`.
  - Authorization Header: `Bearer <accessToken>` attached via request interceptor.
  - Automatic Token Refresh: On HTTP 401, Axios response interceptor calls `POST ${API_BASE_URL}/auth/refresh` with credentials, saves updated access token to Zustand store, and replays the failed request.

- **Backend CORS & Routing:**
  - `backend/app/main.py` allows origins from `settings.cors_origins_list` (`http://localhost:5173`, `http://localhost:3000`).
  - `allow_credentials=True`, methods `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`, headers `["*"]`.

---

## 4. Authentication Mechanism

- **JWT Dual-Token Architecture:**
  - Short-lived Access Token (15 minutes expiry, HS256) returned in response JSON.
  - Long-lived Refresh Token (30 days expiry) set as an `HttpOnly`, `SameSite=Lax` cookie (`refresh_token`) and tracked in the `refresh_tokens` PostgreSQL table with Argon2id hash.
  - Role-based Access Control: User roles include `DONOR`, `RECIPIENT`, and `ADMIN`.
  - Passwords hashed using Argon2id via `argon2-cffi`.
  - Endpoints:
    - `POST /api/v1/auth/register` (Working)
    - `POST /api/v1/auth/login` (Working)
    - `POST /api/v1/auth/refresh` (Working)
    - `POST /api/v1/auth/logout` (Working)
    - `GET /api/v1/me` (Working)
    - `GET /api/v1/auth/me` (Needs alias in router to support `/auth/me` as well as `/me`)

---

## 5. Database Configuration & Audit

- **Connection:**
  - Database URL: `postgresql+psycopg://medbridge_user:MedBridge%402026@localhost:5432/medbridge`.
  - Verified active and running locally (`PostgreSQL 18.4 on x86_64-windows`).
- **Existing Tables in Database:**
  - `users`: Exists.
  - `refresh_tokens`: Exists.
  - `audit_logs`: Exists.
  - `alembic_version`: Exists, but 0 revisions recorded.
- **Missing Tables in Database:**
  - `medicines`
  - `listings`
  - `claims`
  - `needs`
  - `verifications`
  - `notifications`
  - `reports`
- **Alembic State:**
  - `backend/alembic/versions` is currently empty.
  - Need a formal migration to initialize and maintain all models in sync with PostgreSQL.

---

## 6. Current Working Features

1. Frontend static layout, styling, and navigation routing.
2. Frontend component unit tests (Button, EmptyState, StatusBadge, UrgencyBadge).
3. Backend PostgreSQL connection & database health endpoint (`GET /api/v1/health/db`).
4. Backend application health endpoint (`GET /api/v1/health`).
5. Backend user registration, password hashing (Argon2id), and login (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`).
6. Refresh token creation, rotation, and revocation (`POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`).
7. User profile retrieval (`GET /api/v1/me`).
8. Audit log recording for authentication events.

---

## 7. Current Broken & Missing Features

1. **Medicines Service:**
   - Missing: `GET /api/v1/medicines` (search and list medicines with `?q=` query).
   - Missing: `GET /api/v1/medicines/{id}` (fetch medicine details).
   - Database model `Medicine` does not exist in backend.
2. **Listings Service:**
   - Missing: `GET /api/v1/listings` (browse, search, filter by urgency, category, donor type, distance).
   - Missing: `GET /api/v1/listings/{id}` (listing details).
   - Missing: `POST /api/v1/listings` (donor create listing with multipart form data and safety checklist).
   - Missing: `PATCH /api/v1/listings/{id}` (update listing).
   - Missing: `DELETE /api/v1/listings/{id}` (cancel/delete listing).
   - Missing: `POST /api/v1/listings/{id}/report` (report listing).
   - Database model `Listing` does not exist in backend.
3. **Claims Service:**
   - Missing: `GET /api/v1/claims` (list user claims).
   - Missing: `GET /api/v1/claims/{id}` (claim details).
   - Missing: `POST /api/v1/claims` (recipient create claim with verification check).
   - Missing: `PATCH /api/v1/claims/{id}/confirm` (donor confirm claim).
   - Missing: `PATCH /api/v1/claims/{id}/cancel` (cancel claim).
   - Missing: `PATCH /api/v1/claims/{id}/complete` (mark donation complete).
   - Database model `Claim` does not exist in backend.
4. **Recipient Needs Service:**
   - Missing: `GET /api/v1/needs` (list recipient needs).
   - Missing: `GET /api/v1/needs/{id}` (need details).
   - Missing: `POST /api/v1/needs` (create need).
   - Missing: `PATCH /api/v1/needs/{id}` (update need).
   - Missing: `DELETE /api/v1/needs/{id}` (delete need).
   - Database model `Need` does not exist in backend.
5. **Recipient Verification Service:**
   - Missing: `GET /api/v1/recipients/verification` (get verification status).
   - Missing: `POST /api/v1/recipients/verification` (upload document and submit verification).
   - Database model `VerificationSubmission` does not exist in backend.
6. **Dashboards Service:**
   - Missing: `GET /api/v1/donor/dashboard` (and `/api/v1/dashboard/donor`).
   - Missing: `GET /api/v1/recipient/dashboard` (and `/api/v1/dashboard/recipient`).
   - Missing: `GET /api/v1/admin/dashboard`.
7. **Admin Management Service:**
   - Missing: `GET /api/v1/admin/verifications` & `GET /api/v1/admin/verifications/{id}`.
   - Missing: `PATCH /api/v1/admin/recipients/{id}/approve`.
   - Missing: `PATCH /api/v1/admin/recipients/{id}/reject`.
   - Missing: `GET /api/v1/admin/reports` & `PATCH /api/v1/admin/reports/{id}/resolve`.
   - Missing: `GET /api/v1/admin/audit-logs`.
   - Missing: `GET /api/v1/admin/users`.
   - Missing: `GET /api/v1/admin/listings`.
   - Missing: `GET /api/v1/admin/analytics`.
8. **Notifications Service:**
   - Missing: `GET /api/v1/notifications`.
   - Missing: `PATCH /api/v1/notifications/{id}/read`.
   - Missing: `POST /api/v1/notifications/read-all`.
   - Database model `Notification` does not exist in backend.
9. **Automated Expiry & Background Jobs:**
   - Celery/background tasks in `app/workers/tasks` are unpopulated.
   - Expiry recalculation and automatic status transition needs deterministic service and scheduled execution.
10. **File Uploads:**
    - Document and medicine image file upload handler with static file mounting (`/uploads/`) is missing.

---

## 8. API Mismatches Identified

1. **Dashboard Route Paths:**
   - Frontend calls `GET /donor/dashboard` and `GET /recipient/dashboard`.
   - In standard REST or some specs, `/dashboard/donor` and `/dashboard/recipient` are also cited.
   - **Fix:** Support both paths in the router so that either route succeeds seamlessly.
2. **Current User Route:**
   - Frontend `authService.getMe()` calls `/me`.
   - Some tools/tests expect `/auth/me`.
   - **Fix:** Mount the current user endpoint at both `/api/v1/me` and `/api/v1/auth/me`.
3. **Cookie Names:**
   - Backend sets `refresh_token`.
   - In MSW handler, `medbridge_refresh` was also checked.
   - **Fix:** Accept both `refresh_token` and `medbridge_refresh` in cookie extraction.
4. **Mock Mode in Frontend:**
   - `frontend/.env.local` had `VITE_MOCK_MODE=true`, preventing the frontend from communicating with the real backend.
   - **Fix:** Set `VITE_MOCK_MODE=false` in frontend configuration once backend APIs are in place so real PostgreSQL data flows end-to-end.

---

## 9. Environment & Dependency Problems

- **PostgreSQL:** Running and operational on port 5432.
- **Redis:** Redis is not currently running as a Windows service. In accordance with system instructions, the main application should not be blocked or crash when Redis/SMTP is unavailable; fallback and in-process execution should be provided for dev environments, with Celery worker configured for asynchronous tasks when Redis is available.
- **SMTP Email:** SMTP server is currently placeholder in `.env`. Email sending must fail gracefully with warnings in development and never crash application HTTP requests.
- **Static File Directory:** Need local `uploads/` directory with FastAPI static mount for uploaded verification documents and listing photos.

---

## 10. Exact Repair Plan (Phase by Phase)

1. **Phase 4: Environment & Startup Configuration**
   - Configure local `uploads` directory and static files mount in FastAPI.
   - Ensure graceful fallbacks for Redis and SMTP in `app/core/config.py` and email service.
   - Update `frontend/.env.local` to enable real backend communication (`VITE_MOCK_MODE=false`).

2. **Phase 5: Database Models & Alembic Migration**
   - Create SQLAlchemy models for:
     - `Medicine`
     - `Listing`
     - `Claim`
     - `Need`
     - `VerificationSubmission`
     - `Notification`
     - `Report`
   - Configure Alembic to detect all models and generate complete initial migration.
   - Apply migration to PostgreSQL.
   - Create a database seed script (`app/db/seed.py`) providing realistic test data for Admin, Donor, Approved Recipient, Pending Recipient, Medicines, Listings, Needs, and Claims.

3. **Phase 6: API Base URL, CORS, and Route Aliases**
   - Ensure both `/api/v1/me` and `/api/v1/auth/me` are routed.
   - Ensure both `/donor/dashboard` & `/dashboard/donor` and `/recipient/dashboard` & `/dashboard/recipient` work.
   - Support both `refresh_token` and `medbridge_refresh` cookies.

4. **Phase 7 & 8: Authentication, Authorization & RBAC Enforcement**
   - Verify donor/recipient/admin permissions.
   - Enforce verified recipient status for claims.
   - Enforce object-level permissions (donors can only modify their own listings).

5. **Phase 9: Medicine APIs & Autocomplete**
   - Implement `MedicineRepository`, `MedicineService`, and `GET /api/v1/medicines` with search filter `?q=`.
   - Implement `GET /api/v1/medicines/{id}`.

6. **Phase 10: Donor Listing Flow & Eligibility / Urgency Engine**
   - Implement `ListingRepository`, `ListingService`, and router endpoints (`GET`, `POST`, `PATCH`, `DELETE`).
   - Implement backend authoritative eligibility check:
     - Minimum 7 days remaining
     - Sealed packaging required
     - Batch number required
     - Storage confirmed
   - Implement backend authoritative urgency calculation:
     - `> 30 days` = LOW
     - `8 - 30 days` = MEDIUM
     - `4 - 7 days` = HIGH
     - `1 - 3 days` = CRITICAL
     - `<= 0 days` = EXPIRED

7. **Phase 11: Recipient Verification Flow**
   - Implement `VerificationRepository`, `VerificationService`, and router endpoints.
   - Support document upload (PDF, images) and store file metadata.
   - Recipient submit -> PENDING -> Admin review -> APPROVED / REJECTED.

8. **Phase 12: Needs Management**
   - Implement `NeedRepository`, `NeedService`, and router endpoints (`GET`, `POST`, `PATCH`, `DELETE`).

9. **Phase 13 & 14: Matching & Claim System**
   - Implement matching logic using medicine compatibility, quantity, urgency, recipient verification status, and distance (Haversine formula).
   - Implement claim lifecycle (`POST /api/v1/claims`, `PATCH confirm`, `PATCH cancel`, `PATCH complete`).
   - Database transactions and concurrency protection against double claims.

10. **Phase 15: Notifications & Email**
    - Implement in-app notifications on claim, verification status changes, and listing expiry.
    - Graceful SMTP handler.

11. **Phase 16 & 17: Dashboards & Admin Modules**
    - Donor dashboard stats computed directly from PostgreSQL.
    - Recipient dashboard stats computed directly from PostgreSQL.
    - Admin dashboard, verifications review, reports review, users list, listings list, and impact analytics computed directly from PostgreSQL.

12. **Phase 18: File Uploads & Security**
    - Secure file upload validation (file size, mime type, sanitized file name).
    - Private document access for admin and owner.

13. **Phase 19: Background Tasks & Automatic Expiry**
    - Expiry engine to update urgency and mark listings as EXPIRED when expiry date passes.
    - Celery task configuration and fallback direct service runner.

14. **Phase 20 - 24: Comprehensive Testing, End-to-End Verification & Documentation**
    - Write unit and integration pytest tests.
    - Run end-to-end full user journey in browser / API.
    - Verify zero console errors, zero backend errors.
    - Final production checklist and final report.
