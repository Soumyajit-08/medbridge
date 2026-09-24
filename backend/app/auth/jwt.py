"""
app/auth/jwt.py
──────────────────────────────────────────────────────────────────────────────
JWT (JSON Web Token) creation and verification.

WHY JWT?
  The frontend stores an access token after login.
  On every subsequent request, it sends:
    Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

  The backend verifies this token WITHOUT touching the database.
  This makes authentication fast (no DB query needed per request).

TOKEN TYPES:
  Access Token  → Short-lived (15 min). Used for all API calls.
  Refresh Token → Long-lived (30 days). Used ONLY to get a new access token.

WHY TWO TOKENS?
  If an access token is stolen, it expires in 15 minutes.
  If the refresh token is stolen, we can revoke it (it's stored in the DB).

JWT STRUCTURE (3 parts separated by dots):
  eyJhbGciOiJIUzI1NiJ9   ← Header (algorithm)
  eyJ1c2VyX2lkIjoiMSJ9   ← Payload (the data you stored)
  SflKxwRJSMeKKF2QT4fw   ← Signature (proves it wasn't tampered with)

REQUEST FLOW:
  Login response includes accessToken
    → Frontend stores it in memory (Zustand authStore)
      → Every request: Authorization: Bearer <token>
        → verify_access_token() decodes the token
          → returns user_id, role from the payload
            → get_current_user() fetches user from DB
"""

from datetime import timedelta
from typing import Optional
from jose import jwt, JWTError

from app.core.config import settings
from app.core.constants import (
    JWT_ALGORITHM,
    JWT_ACCESS_TOKEN_TYPE,
    JWT_REFRESH_TOKEN_TYPE,
)
from app.utils.datetime_utils import utc_now
from app.utils.exceptions import AuthenticationError


# ── Token Creation ────────────────────────────────────────────────────────────

def create_access_token(user_id: str, role: str) -> str:
    """
    Create a short-lived JWT access token.

    The token payload contains:
      - sub: user ID (standard JWT "subject" claim)
      - role: user's role (DONOR / RECIPIENT / ADMIN)
      - type: "access" (so we don't accidentally use a refresh token as access)
      - exp: expiry timestamp (auto-verified by jose library)

    Args:
        user_id: The user's UUID as a string.
        role:    The user's role string (e.g., "DONOR").

    Returns:
        A signed JWT string like "eyJhbGci..."
    """
    now = utc_now()
    expires_at = now + timedelta(minutes=settings.JWT_ACCESS_EXPIRES_MINUTES)

    payload = {
        "sub": user_id,           # subject = who this token belongs to
        "role": role,             # role for authorization checks
        "type": JWT_ACCESS_TOKEN_TYPE,
        "iat": now,               # issued at
        "exp": expires_at,        # expiry
    }

    return jwt.encode(
        payload,
        settings.JWT_ACCESS_SECRET,  # sign with our secret key
        algorithm=JWT_ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    """
    Create a long-lived JWT refresh token.

    The refresh token payload is minimal — just user_id and expiry.
    We also store a hash of it in the database so we can revoke it.

    Args:
        user_id: The user's UUID as a string.

    Returns:
        A signed JWT string.
    """
    now = utc_now()
    expires_at = now + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS)

    payload = {
        "sub": user_id,
        "type": JWT_REFRESH_TOKEN_TYPE,
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.JWT_REFRESH_SECRET,  # different secret from access token!
        algorithm=JWT_ALGORITHM,
    )


# ── Token Verification ────────────────────────────────────────────────────────

def verify_access_token(token: str) -> dict:
    """
    Decode and verify a JWT access token.

    Raises:
        AuthenticationError: If the token is invalid, expired, or tampered with.

    Returns:
        The token payload dict (contains sub, role, type, exp).

    WHAT "VERIFY" MEANS:
      1. Decode the token using the secret key
      2. Check the signature (if tampered → invalid)
      3. Check expiry (if expired → invalid)
      4. Check that type == "access" (not a refresh token being misused)
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_ACCESS_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except JWTError:
        raise AuthenticationError("Token is invalid or expired")

    # Extra safety: ensure this is an access token, not a refresh token
    if payload.get("type") != JWT_ACCESS_TOKEN_TYPE:
        raise AuthenticationError("Invalid token type")

    return payload


def verify_refresh_token(token: str) -> dict:
    """
    Decode and verify a JWT refresh token.

    Raises:
        AuthenticationError: If invalid.

    Returns:
        The payload dict (contains sub, type, exp).
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_REFRESH_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except JWTError:
        raise AuthenticationError("Refresh token is invalid or expired")

    if payload.get("type") != JWT_REFRESH_TOKEN_TYPE:
        raise AuthenticationError("Invalid token type")

    return payload


def get_user_id_from_token(payload: dict) -> str:
    """Extract user_id from a verified token payload."""
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Token payload is missing user ID")
    return user_id
