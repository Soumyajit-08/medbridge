# MedBridge API Integration Map

This document maps every frontend API request across services, hooks, and components to its corresponding FastAPI backend endpoint, schemas, and implementation status.

| Frontend Feature | Frontend File | HTTP Method | URL | Backend Router | Backend Service | Request Body | Response | Status |
|---|---|---|---|---|---|---|---|---|
| Register User | `services/authService.ts` | POST | `/auth/register` | `routers/auth.py` | `services/auth_service.py` | `RegisterRequest` (name, email, phone, password, role, donorType / org details) | `AuthResponse` (`{ user, accessToken }`) + HttpOnly refresh cookie | WORKING |
| Login User | `services/authService.ts` | POST | `/auth/login` | `routers/auth.py` | `services/auth_service.py` | `LoginRequest` (`{ email, password }`) | `AuthResponse` (`{ user, accessToken }`) + HttpOnly refresh cookie | WORKING |
| Refresh Token | `services/authService.ts` / `services/api.ts` | POST | `/auth/refresh` | `routers/auth.py` | `services/auth_service.py` | Empty body (cookie: `refresh_token`) | `AuthResponse` (`{ user, accessToken }`) + HttpOnly refresh cookie | WORKING |
| Logout User | `services/authService.ts` | POST | `/auth/logout` | `routers/auth.py` | `services/auth_service.py` | Empty body | `MessageResponse` (`{ success, message }`) + delete cookie | WORKING |
| Forgot Password | `services/authService.ts` | POST | `/auth/forgot-password` | `routers/auth.py` | `services/auth_service.py` | `ForgotPasswordRequest` (`{ email }`) | `MessageResponse` (`{ success, message }`) | WORKING (Stub) |
| Reset Password | `services/authService.ts` | POST | `/auth/reset-password` | `routers/auth.py` | `services/auth_service.py` | `ResetPasswordRequest` (`{ token, password }`) | `MessageResponse` (`{ success, message }`) | WORKING (Stub) |
| Current User (Profile) | `services/authService.ts` | GET | `/me` (and `/auth/me`) | `routers/auth.py` | `services/auth_service.py` | None (Bearer token) | `AuthUserResponse` (`AuthUser`) | WORKING |
| Search Medicines | `services/medicineService.ts` | GET | `/medicines` | `routers/medicine.py` | `services/medicine_service.py` | Query: `q` | `MedicineSearchResult[]` | MISSING (404) |
| Medicine Details | `services/medicineService.ts` | GET | `/medicines/:id` | `routers/medicine.py` | `services/medicine_service.py` | None | `Medicine` | MISSING (404) |
| Get Listings (Feed/Search) | `services/listingService.ts` | GET | `/listings` | `routers/listing.py` | `services/listing_service.py` | Query: `search, urgency, category, donorType, expiryWindow, maxDistance, sort, page, limit, mine` | `PaginatedListings` (`{ data, total, page, limit, totalPages }`) | MISSING (404) |
| Get Listing by ID | `services/listingService.ts` | GET | `/listings/:id` | `routers/listing.py` | `services/listing_service.py` | None | `Listing` | MISSING (404) |
| Create Listing | `services/listingService.ts` | POST | `/listings` | `routers/listing.py` | `services/listing_service.py` | `multipart/form-data`: `CreateListingPayload` + optional `image` file | `Listing` | MISSING (404) |
| Update Listing | `services/listingService.ts` | PATCH | `/listings/:id` | `routers/listing.py` | `services/listing_service.py` | Partial `CreateListingPayload` | `Listing` | MISSING (404) |
| Delete Listing | `services/listingService.ts` | DELETE | `/listings/:id` | `routers/listing.py` | `services/listing_service.py` | None | None (204 or 200) | MISSING (404) |
| Report Listing | `services/listingService.ts` | POST | `/listings/:id/report` | `routers/report.py` | `services/report_service.py` | `{ reason: string }` | None / `MessageResponse` | MISSING (404) |
| Get My Listings | `services/listingService.ts` | GET | `/listings?mine=true` | `routers/listing.py` | `services/listing_service.py` | Query: `mine=true, page, limit` | `PaginatedListings` | MISSING (404) |
| Get Claims | `services/claimService.ts` | GET | `/claims` | `routers/claim.py` | `services/claim_service.py` | Query: `status, page, limit` | `PaginatedClaims` (`{ data, total, page, limit, totalPages }`) | MISSING (404) |
| Get Claim by ID | `services/claimService.ts` | GET | `/claims/:id` | `routers/claim.py` | `services/claim_service.py` | None | `Claim` | MISSING (404) |
| Create Claim | `services/claimService.ts` | POST | `/claims` | `routers/claim.py` | `services/claim_service.py` | `CreateClaimPayload` (`{ listingId, requestedQuantity }`) | `Claim` | MISSING (404) |
| Confirm Claim | `services/claimService.ts` | PATCH | `/claims/:id/confirm` | `routers/claim.py` | `services/claim_service.py` | None | `Claim` | MISSING (404) |
| Cancel Claim | `services/claimService.ts` | PATCH | `/claims/:id/cancel` | `routers/claim.py` | `services/claim_service.py` | None | `Claim` | MISSING (404) |
| Complete Claim | `services/claimService.ts` | PATCH | `/claims/:id/complete` | `routers/claim.py` | `services/claim_service.py` | None | `Claim` | MISSING (404) |
| Get Needs | `services/needService.ts` | GET | `/needs` | `routers/need.py` | `services/need_service.py` | Query: `page, limit` | `PaginatedNeeds` (`{ data, total, page, limit, totalPages }`) | MISSING (404) |
| Get Need by ID | `services/needService.ts` | GET | `/needs/:id` | `routers/need.py` | `services/need_service.py` | None | `Need` | MISSING (404) |
| Create Need | `services/needService.ts` | POST | `/needs` | `routers/need.py` | `services/need_service.py` | `CreateNeedPayload` (`{ medicineId, quantityNeeded, urgency, city, state, description, expiresAt }`) | `Need` | MISSING (404) |
| Update Need | `services/needService.ts` | PATCH | `/needs/:id` | `routers/need.py` | `services/need_service.py` | Partial `CreateNeedPayload` | `Need` | MISSING (404) |
| Delete Need | `services/needService.ts` | DELETE | `/needs/:id` | `routers/need.py` | `services/need_service.py` | None | None (204 or 200) | MISSING (404) |
| Get Notifications | `services/notificationService.ts` | GET | `/notifications` | `routers/notification.py` | `services/notification_service.py` | None | `PaginatedNotifications` (`{ data, total, unreadCount }`) | MISSING (404) |
| Mark Notification Read | `services/notificationService.ts` | PATCH | `/notifications/:id/read` | `routers/notification.py` | `services/notification_service.py` | None | `Notification` | MISSING (404) |
| Mark All Notifications Read | `services/notificationService.ts` | POST | `/notifications/read-all` | `routers/notification.py` | `services/notification_service.py` | None | `MessageResponse` | MISSING (404) |
| Get Recipient Verification | `services/verificationService.ts` | GET | `/recipients/verification` | `routers/verification.py` | `services/verification_service.py` | None | `VerificationSubmission` or `null` | MISSING (404) |
| Submit Recipient Verification | `services/verificationService.ts` | POST | `/recipients/verification` | `routers/verification.py` | `services/verification_service.py` | `multipart/form-data`: `registrationNumber`, `document` (file) | `VerificationSubmission` | MISSING (404) |
| Donor Dashboard Stats | `services/dashboardService.ts` | GET | `/donor/dashboard` (and `/dashboard/donor`) | `routers/dashboard.py` | `services/dashboard_service.py` | None | `DashboardStats` | MISSING (404) |
| Recipient Dashboard Stats | `services/dashboardService.ts` | GET | `/recipient/dashboard` (and `/dashboard/recipient`) | `routers/dashboard.py` | `services/dashboard_service.py` | None | `DashboardStats` | MISSING (404) |
| Admin Dashboard Stats | `services/adminService.ts` | GET | `/admin/dashboard` | `routers/admin.py` | `services/admin_service.py` | None | `AdminDashboardStats` | MISSING (404) |
| Admin Verifications Queue | `services/adminService.ts` | GET | `/admin/verifications` | `routers/admin.py` | `services/admin_service.py` | None | `VerificationSubmission[]` | MISSING (404) |
| Admin Verification Details | `services/adminService.ts` | GET | `/admin/verifications/:id` | `routers/admin.py` | `services/admin_service.py` | None | `VerificationSubmission` | MISSING (404) |
| Admin Approve Recipient | `services/adminService.ts` | PATCH | `/admin/recipients/:id/approve` | `routers/admin.py` | `services/admin_service.py` | None | `MessageResponse` | MISSING (404) |
| Admin Reject Recipient | `services/adminService.ts` | PATCH | `/admin/recipients/:id/reject` | `routers/admin.py` | `services/admin_service.py` | `{ reason: string }` | `MessageResponse` | MISSING (404) |
| Admin Reports Queue | `services/adminService.ts` | GET | `/admin/reports` | `routers/admin.py` | `services/admin_service.py` | None | `ReportEntry[]` | MISSING (404) |
| Admin Resolve Report | `services/adminService.ts` | PATCH | `/admin/reports/:id/resolve` | `routers/admin.py` | `services/admin_service.py` | None | `MessageResponse` | MISSING (404) |
| Admin Audit Logs | `services/adminService.ts` | GET | `/admin/audit-logs` | `routers/admin.py` | `services/admin_service.py` | Query: `event, page, limit` | `{ data: AuditLogEntry[], total: number }` | MISSING (404) |
| Admin Users List | `services/adminService.ts` | GET | `/admin/users` | `routers/admin.py` | `services/admin_service.py` | None | `User[]` | MISSING (404) |
| Admin Listings List | `services/adminService.ts` | GET | `/admin/listings` | `routers/admin.py` | `services/admin_service.py` | None | `PaginatedListings` | MISSING (404) |
| Admin Impact Analytics | `services/adminService.ts` | GET | `/admin/analytics` | `routers/admin.py` | `services/admin_service.py` | None | `ImpactMetrics` | MISSING (404) |
