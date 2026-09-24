"""
app/core/dependencies.py
──────────────────────────────────────────────────────────────────────────────
FastAPI dependency functions for authentication and authorization.
"""

from typing import Optional
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.database import Database

from app.db.session import get_db
from app.auth.jwt import verify_access_token, get_user_id_from_token
from app.repositories.user_repository import user_repository
from app.utils.enums import UserRole
from app.utils.exceptions import AuthenticationError, AuthorizationError
from app.models.user import User
from app.core.constants import REFRESH_TOKEN_COOKIE_NAME


_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Database = Depends(get_db),
) -> User:
    """
    Extract and validate the current user from the Bearer token.
    """
    if not credentials:
        raise AuthenticationError("Authorization token is required")

    token = credentials.credentials
    payload = verify_access_token(token)
    user_id_str = get_user_id_from_token(payload)

    user = user_repository.get_by_id(db, user_id_str)
    if not user:
        raise AuthenticationError("User not found or account deactivated")

    if not user.is_active:
        raise AuthenticationError("Your account has been deactivated")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "ADMIN" and current_user.role != UserRole.ADMIN:
        raise AuthorizationError("Admin access required")
    return current_user


def require_donor(current_user: User = Depends(get_current_user)) -> User:
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "DONOR" and current_user.role != UserRole.DONOR:
        raise AuthorizationError("Donor access required")
    return current_user


def require_recipient(current_user: User = Depends(get_current_user)) -> User:
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "RECIPIENT" and current_user.role != UserRole.RECIPIENT:
        raise AuthorizationError("Recipient access required")
    return current_user


def require_donor_or_recipient(current_user: User = Depends(get_current_user)) -> User:
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val not in ("DONOR", "RECIPIENT", UserRole.DONOR, UserRole.RECIPIENT):
        raise AuthorizationError("Donor or Recipient access required")
    return current_user


def get_refresh_token_from_cookie(request: Request) -> Optional[str]:
    return request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
