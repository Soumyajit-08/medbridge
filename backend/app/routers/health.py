"""
app/routers/health.py
──────────────────────────────────────────────────────────────────────────────
Health check endpoints.

WHY HEALTH CHECKS?
  1. Verify the app is running: GET /api/v1/health
  2. Verify DB is reachable:   GET /api/v1/health/db

These endpoints:
  - Are used by Docker/Kubernetes/monitoring to know if the container is healthy
  - Are the first thing tested after startup
  - Never require authentication
"""

from fastapi import APIRouter, Depends
from pymongo.database import Database
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(
    prefix="/health",
    tags=["Health"],
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
    """
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


@router.get(
    "/db",
    summary="Database connectivity check",
    description="Verifies that FastAPI can connect to MongoDB.",
    response_description="Database connection status",
)
def db_health_check(db: Database = Depends(get_db)):
    """
    Database connectivity check.
    Pings MongoDB.
    """
    try:
        db.command("ping")
        return {
            "status": "ok",
            "database": "connected",
            "db_name": db.name,
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(e) if settings.DEBUG else "Database connection failed",
        }
