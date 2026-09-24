"""
app/core/dependencies.py
──────────────────────────────────────────────────────────────────────────────
FastAPI dependency functions for authentication and authorization.

WHY DEPENDENCIES?
  FastAPI's `Depends()` system lets you declare what a route "needs"
  before it runs. This keeps routes clean and DRY.

  Instead of writing auth logic in every route:
    @router.get("/listings")
    def get_listings():
        token = request.headers.get("Authorization")
        if not token: raise ...
        payload = verify_token(token) ...
        user = db.query(User).filter(...).first() ...
        if user.role != "DONOR": raise ...

  You write:
    @router.get("/listings")
    def get_listings(current_user = Depends(require_donor)):
        # current_user is already verified and authorized

HOW IT WORKS:
  FastAPI calls get_current_user() BEFORE calling your route function.
  If it raises an exception, the route never runs.
  If it succeeds, it injects `current_user` into the route.

USAGE:
  from app.core.dependencies import get_current_user, require_admin

  # Any authenticated user:
  @router.get("/me")
  def get_me(current_user = Depends(get_current_user)):
      return current_user

  # Only ADMIN:
  @router.get("/admin/dashboard")
  def admin_dashboard(current_user = Depends(require_admin)):
      return ...

  # Only DONOR:
  @router.post("/listings")
  def create_listing(current_user = Depends(require_donor)):
      return ...
"""

import uuid
from typing import Optional
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.auth.jwt import verify_access_token, get_user_id_from_token
from app.repositories.user_repository import user_repository
from app.utils.enums import UserRole
from app.utils.exceptions import AuthenticationError, AuthorizationError
from app.models.user import User
from app.core.constants import REFRESH_TOKEN_COOKIE_NAME


# ── Token Extractor ───────────────────────────────────────────────────────────
# HTTPBearer reads the "Authorization: Bearer <token>" header
# auto_error=False means it returns None (instead of raising) if header is missing
# We handle the "missing" case ourselves with a better error message

_bearer_scheme = HTTPBearer(auto_error=False)


# ── Core User Dependency ──────────────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Extract and validate the current user from the Bearer token.

    Steps:
      1. Extract token from Authorization header
      2. Verify JWT signature and expiry
      3. Extract user_id from payload
      4. Fetch user from database
      5. Verify user is active
      6. Return User model object

    Used as a dependency in protected routes.
    If anything fails, raises AuthenticationError (→ 401 response).
    """
    if not credentials:
        raise AuthenticationError("Authorization token is required")

    token = credentials.credentials

    # Verify token (raises AuthenticationError if invalid)
    payload = verify_access_token(token)
    user_id_str = get_user_id_from_token(payload)

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthenticationError("Invalid token payload")

    # Fetch from database
    user = user_repository.get_by_id(db, user_id)
    if not user:
        raise AuthenticationError("User not found or account deactivated")

    if not user.is_active:
        raise AuthenticationError("Your account has been deactivated")

    return user


# ── Role-Based Dependencies ───────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires the current user to be ADMIN.
    Use this on all admin-only endpoints.

    Usage: current_user = Depends(require_admin)
    """
    if current_user.role != UserRole.ADMIN:
        raise AuthorizationError("Admin access required")
    return current_user


def require_donor(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires the current user to be DONOR.
    Use this for listing creation, donation management, etc.
    """
    if current_user.role != UserRole.DONOR:
        raise AuthorizationError("Donor access required")
    return current_user


def require_recipient(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires the current user to be RECIPIENT.
    Use this for claiming, needs management, verification, etc.
    """
    if current_user.role != UserRole.RECIPIENT:
        raise AuthorizationError("Recipient access required")
    return current_user


def require_donor_or_recipient(current_user: User = Depends(get_current_user)) -> User:
    """
    Allows both DONOR and RECIPIENT roles.
    Use for shared features like notifications.
    """
    if current_user.role not in (UserRole.DONOR, UserRole.RECIPIENT):
        raise AuthorizationError("Donor or Recipient access required")
    return current_user


# ── Cookie Extractor ──────────────────────────────────────────────────────────

def get_refresh_token_from_cookie(request: Request) -> Optional[str]:
    """
    Extract the refresh token from an HttpOnly cookie.
    Returns None if the cookie doesn't exist.

    The frontend sends this automatically with:
        withCredentials: true (in axios config)
    """
    return request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
