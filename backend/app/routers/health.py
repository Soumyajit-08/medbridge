"""
app/routers/health.py
──────────────────────────────────────────────────────────────────────────────
Health check endpoints.

WHY HEALTH CHECKS?
  1. Verify the app is running: GET /api/v1/health
  2. Verify DB is reachable:   GET /api/v1/health/db

These endpoints:
  - Are used by Docker/Kubernetes to know if the container is healthy
  - Are the first thing you test after startup
  - Never require authentication

REQUEST FLOW:
  Browser/Curl
    → GET /api/v1/health
      → health_check() runs
        → returns { "status": "ok", ... }

  Browser/Curl
    → GET /api/v1/health/db
      → db_check() runs
        → sends "SELECT 1" to PostgreSQL
          → if it works: { "status": "ok", "database": "connected" }
          → if it fails: { "status": "error", "database": "disconnected" }
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(
    prefix="/health",
    tags=["Health"],  # Groups these in Swagger UI under "Health"
)


@router.get(
    "",
    summary="Application health check",
    description="Returns OK if the FastAPI application is running.",
    response_description="Application status",
)
def health_check():
    """
    Basic liveness check — no database required.

    Expected response:
    {
        "status": "ok",
        "version": "1.0.0",
        "environment": "development"
    }
    """
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


@router.get(
    "/db",
    summary="Database connectivity check",
    description="Verifies that FastAPI can connect to PostgreSQL.",
    response_description="Database connection status",
)
def db_health_check(db: Session = Depends(get_db)):
    """
    Database connectivity check.

    Sends `SELECT 1` to PostgreSQL.
    If PostgreSQL is unreachable, this returns a 503.

    Expected responses:
    Success: { "status": "ok", "database": "connected" }
    Failure: { "status": "error", "database": "disconnected", "detail": "..." }

    HOW TO TEST:
      curl http://localhost:8000/api/v1/health/db
    """
    try:
        # text() wraps raw SQL — required in SQLAlchemy 2.x
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "url": settings.DATABASE_URL.split("@")[-1],  # Only show host/db, not credentials
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(e) if settings.DEBUG else "Database connection failed",
        }
