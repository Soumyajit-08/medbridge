"""
app/utils/exceptions.py
──────────────────────────────────────────────────────────────────────────────
Custom exception hierarchy for MedBridge.

WHY CUSTOM EXCEPTIONS?
When something goes wrong, we want to return a safe, consistent JSON response.
We NEVER want to leak:
  - Raw database errors (SQL, table names, column names)
  - Stack traces
  - Internal implementation details
  - Secrets or credentials

HOW IT WORKS:
  1. Any service or repository can `raise ResourceNotFoundError("Listing")`
  2. FastAPI's exception handlers (registered in main.py) catch these
  3. They return a clean JSON response like:
     { "success": false, "message": "Listing not found", "error_code": "NOT_FOUND" }

REQUEST FLOW (what happens when an error occurs):
  Router
    → Service
      → raises MedBridgeException
        → caught by exception_handler in main.py
          → returns safe JSON to frontend
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Optional


# ── Base Exception ────────────────────────────────────────────────────────────

class MedBridgeException(Exception):
    """
    Base class for all MedBridge application errors.
    Every custom exception inherits from this.
    """
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int,
        detail: Optional[str] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.detail = detail
        super().__init__(message)


# ── 400 Bad Request ───────────────────────────────────────────────────────────

class ValidationError(MedBridgeException):
    """
    Raised when request data is semantically invalid
    (after Pydantic validation already passed).
    Example: "Expiry date must be in the future."
    """
    def __init__(self, message: str, error_code: str = "VALIDATION_ERROR"):
        super().__init__(message, error_code, 400)


# ── 401 Unauthorized ──────────────────────────────────────────────────────────

class AuthenticationError(MedBridgeException):
    """
    Raised when the user is not authenticated.
    Example: JWT token is missing, expired, or invalid.
    """
    def __init__(self, message: str = "Authentication required", error_code: str = "AUTHENTICATION_REQUIRED"):
        super().__init__(message, error_code, 401)


# ── 403 Forbidden ─────────────────────────────────────────────────────────────

class AuthorizationError(MedBridgeException):
    """
    Raised when the user IS authenticated but does NOT have permission.
    Example: A DONOR trying to access an ADMIN endpoint.
    Example: A user trying to edit another user's listing.
    """
    def __init__(self, message: str = "You do not have permission to perform this action", error_code: str = "FORBIDDEN"):
        super().__init__(message, error_code, 403)


# ── 404 Not Found ─────────────────────────────────────────────────────────────

class ResourceNotFoundError(MedBridgeException):
    """
    Raised when a requested resource does not exist in the database.
    Example: `raise ResourceNotFoundError("Listing")`
    → returns: { "message": "Listing not found", "error_code": "NOT_FOUND" }
    """
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            message=f"{resource} not found",
            error_code="NOT_FOUND",
            status_code=404,
        )


# ── 409 Conflict ──────────────────────────────────────────────────────────────

class ConflictError(MedBridgeException):
    """
    Raised when an action would violate uniqueness constraints.
    Example: Trying to register with an email that already exists.
    Example: Trying to claim a listing that was just claimed by someone else.
    """
    def __init__(self, message: str, error_code: str = "CONFLICT"):
        super().__init__(message, error_code, 409)


# ── 422 Business Rule Violation ───────────────────────────────────────────────

class BusinessRuleError(MedBridgeException):
    """
    Raised when a business rule is violated.
    This is different from Pydantic validation — these are domain rules.
    Examples:
      - "Unverified recipients cannot claim listings."
      - "Listing has already been claimed."
      - "Cannot cancel a completed claim."
    """
    def __init__(self, message: str, error_code: str = "BUSINESS_RULE_VIOLATION"):
        super().__init__(message, error_code, 422)


# ── 500 Internal Server Error ─────────────────────────────────────────────────

class InternalError(MedBridgeException):
    """
    Raised for unexpected internal errors.
    The message returned to the client is always generic.
    The real detail is logged server-side (never sent to client).
    """
    def __init__(self, detail: str = "An internal error occurred"):
        super().__init__(
            message="An unexpected error occurred. Please try again later.",
            error_code="INTERNAL_ERROR",
            status_code=500,
            detail=detail,
        )


# ── FastAPI Exception Handlers ────────────────────────────────────────────────

def medbridge_exception_handler(request: Request, exc: MedBridgeException) -> JSONResponse:
    """
    This function is registered in main.py.
    FastAPI calls it whenever a MedBridgeException is raised anywhere.
    It converts the exception into a safe JSON response.

    Example response:
    {
        "success": false,
        "message": "Listing not found",
        "error_code": "NOT_FOUND"
    }
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
        },
    )


def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catches any unhandled Python exception.
    Returns a generic 500 response — never leaks internal details.
    In production, you would also log exc to your error tracking system here.
    """
    # TODO: In production, send to Sentry / logging here
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred. Please try again later.",
            "error_code": "INTERNAL_ERROR",
        },
    )
