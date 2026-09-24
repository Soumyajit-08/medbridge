"""
app/main.py
──────────────────────────────────────────────────────────────────────────────
FastAPI application entry point.

THIS IS WHERE IT ALL COMES TOGETHER.

This file:
  1. Creates the FastAPI application instance
  2. Configures CORS (so the React frontend can talk to us)
  3. Registers middleware (logging, request IDs)
  4. Registers exception handlers (converts errors to safe JSON)
  5. Includes all routers (health, auth, listings, claims, etc.)
  6. Configures OpenAPI/Swagger documentation

STARTUP FLOW:
  uvicorn app.main:app --reload
    → Python loads this module
      → FastAPI app is created
        → CORS is configured
          → Routers are included
            → App starts listening on port 8000
              → Swagger UI available at http://localhost:8000/docs

REQUEST FLOW (every HTTP request goes through this sequence):
  Browser
    → uvicorn (ASGI server)
      → CORS middleware (check origin)
        → Request ID middleware (attach unique ID)
          → Logging middleware (log request)
            → Router (match URL to route handler)
              → Dependencies (db session, current user)
                → Route handler
                  → Service
                    → Repository
                      → PostgreSQL
                        → Response back up the chain
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.constants import API_V1_PREFIX
from app.utils.exceptions import (
    MedBridgeException,
    medbridge_exception_handler,
    generic_exception_handler,
)

# ── Import Routers ────────────────────────────────────────────────────────────
from app.routers import health
from app.routers.auth import auth_router, router as me_router
from app.routers.medicines import router as medicines_router
from app.routers.listings import router as listings_router
from app.routers.claims import router as claims_router
from app.routers.needs import router as needs_router
from app.routers.notifications import router as notifications_router
from app.routers.verification import router as verification_router
from app.routers.dashboards import router as dashboards_router
from app.routers.admin import router as admin_router


# ── Create FastAPI Instance ───────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## MedBridge — Medicine Expiry & Donation Bridge

A platform connecting medicine donors with verified healthcare recipients
to reduce pharmaceutical waste and improve healthcare access.

### Authentication
Most endpoints require a `Bearer` token in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

Obtain a token by calling `POST /api/v1/auth/login`.

### Roles
- **DONOR** — Can create and manage medicine listings
- **RECIPIENT** — Can browse listings and claim medicines (must be verified)
- **ADMIN** — Full administrative access
    """,
    # Swagger UI settings
    docs_url="/docs",       # http://localhost:8000/docs
    redoc_url="/redoc",     # http://localhost:8000/redoc
    openapi_url="/openapi.json",
    # Security scheme — this adds the "Authorize" button in Swagger
    swagger_ui_parameters={"persistAuthorization": True},
)


# ── CORS Configuration ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # e.g., ["http://localhost:5173", "http://localhost:5174"]
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https?://.*\.vercel\.app$",
    allow_credentials=True,               # Required for cookies (refresh tokens)
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],                  # Allow all headers including Authorization
)


# ── Exception Handlers ────────────────────────────────────────────────────────
app.add_exception_handler(MedBridgeException, medbridge_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# ── Static Files (uploaded images) ───────────────────────────────────────────
# Serve uploaded images at /uploads/* so frontend can display them.
# The uploads directory is created automatically if it doesn't exist.
uploads_path = Path("uploads")
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── Include Routers ───────────────────────────────────────────────────────────
# Each router handles a group of related endpoints.
# prefix="/api/v1" is added here once instead of repeating it in every router.

# Health checks
app.include_router(health.router, prefix=API_V1_PREFIX)

# Authentication (auth_router: /api/v1/auth/..., me_router: /api/v1/me)
app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(me_router, prefix=API_V1_PREFIX)

# Medicine catalogue
app.include_router(medicines_router, prefix=API_V1_PREFIX)

# Core donation flow
app.include_router(listings_router, prefix=API_V1_PREFIX)
app.include_router(claims_router, prefix=API_V1_PREFIX)
app.include_router(needs_router, prefix=API_V1_PREFIX)

# Notifications
app.include_router(notifications_router, prefix=API_V1_PREFIX)

# Recipient verification
app.include_router(verification_router, prefix=API_V1_PREFIX)

# Role dashboards (donor, recipient)
app.include_router(dashboards_router, prefix=API_V1_PREFIX)

# Admin panel
app.include_router(admin_router, prefix=API_V1_PREFIX)


# ── Root Redirect ─────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
def root():
    """Redirect root to docs for convenience during development."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": f"{API_V1_PREFIX}/health",
    }
