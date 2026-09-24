"""
app/routers/auth.py
──────────────────────────────────────────────────────────────────────────────
Authentication router — HTTP endpoints for registration, login, refresh, logout.

ROUTER RESPONSIBILITIES:
  1. Read the request (from body, headers, cookies)
  2. Call the appropriate service method
  3. Commit the database transaction
  4. Set cookies (for refresh token)
  5. Return the response

ROUTER DOES NOT:
  - Validate business rules (that's the service's job)
  - Write to the database directly (that's the repository's job)
  - Hash passwords (that's auth/password.py's job)

REFRESH TOKEN COOKIE:
  The refresh token is stored in an HttpOnly cookie.
  HttpOnly = JavaScript cannot read it (protects against XSS attacks).
  The frontend doesn't need to handle it — the browser sends it automatically.

ENDPOINTS:
  POST /api/v1/auth/register  → Create account
  POST /api/v1/auth/login     → Get tokens
  POST /api/v1/auth/refresh   → Rotate tokens (uses cookie)
  POST /api/v1/auth/logout    → Revoke refresh token (clears cookie)
  GET  /api/v1/me             → Get current user info
"""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_refresh_token_from_cookie
from app.services.auth_service import auth_service
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    AuthResponse,
    MessageResponse,
    AuthUserResponse,
)
from app.core.constants import REFRESH_TOKEN_COOKIE_NAME
from app.core.config import settings
from app.utils.exceptions import AuthenticationError

# ── Router Setup ──────────────────────────────────────────────────────────────

router = APIRouter(tags=["Authentication"])

# This router is for /auth/* endpoints
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """
    Set the refresh token as an HttpOnly cookie.

    HttpOnly: Cannot be accessed by JavaScript → safe from XSS
    Secure: Only sent over HTTPS (we allow non-secure in dev)
    SameSite=Lax: Sent on same-origin + top-level cross-origin navigations
    """
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,               # Cannot be read by JS
        secure=settings.is_production,  # HTTPS only in production
        samesite="lax",
        max_age=settings.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60,  # seconds
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Remove the refresh token cookie on logout."""
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        path="/",
    )


# ── Register ──────────────────────────────────────────────────────────────────

@auth_router.post(
    "/register",
    summary="Register a new user",
    description="""
Create a new DONOR or RECIPIENT account.

**DONOR registration** requires: `donorType`

**RECIPIENT registration** requires: `organizationName`, `organizationType`

Returns an access token immediately — the user is logged in after registration.
The refresh token is set as an HttpOnly cookie.
    """,
    response_model=AuthResponse,
    status_code=201,
)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Register a new user account.

    REQUEST FLOW:
      Frontend: POST /api/v1/auth/register
        → Pydantic validates payload
          → auth_service.register() creates user + tokens
            → db.commit() saves everything
              → Cookie set with refresh token
                → Response: { user, accessToken }
    """
    ip = request.client.host if request.client else None

    user, access_token, refresh_token = auth_service.register(
        db, payload=payload, ip_address=ip
    )

    # Commit the transaction — saves user + refresh token to PostgreSQL
    db.commit()

    # Set HttpOnly cookie
    _set_refresh_cookie(response, refresh_token)

    # Build response matching frontend AuthResponse interface
    user_data = AuthUserResponse.from_user(user)
    return AuthResponse(
        user=user_data.model_dump_camel(),
        accessToken=access_token,
    )


# ── Login ─────────────────────────────────────────────────────────────────────

@auth_router.post(
    "/login",
    summary="Login with email and password",
    description="""
Authenticate with email and password.

Returns an access token. The refresh token is set as an HttpOnly cookie.

**Security note:** The same error is returned for both wrong email and wrong password
to prevent user enumeration attacks.
    """,
    response_model=AuthResponse,
)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None

    user, access_token, refresh_token = auth_service.login(
        db, email=payload.email, password=payload.password, ip_address=ip
    )

    db.commit()
    _set_refresh_cookie(response, refresh_token)

    user_data = AuthUserResponse.from_user(user)
    return AuthResponse(
        user=user_data.model_dump_camel(),
        accessToken=access_token,
    )


# ── Refresh ───────────────────────────────────────────────────────────────────

@auth_router.post(
    "/refresh",
    summary="Refresh access token",
    description="""
Use the refresh token (HttpOnly cookie) to get a new access token.

The old refresh token is **revoked** and a new one is issued (token rotation).
The frontend's axios interceptor calls this automatically on 401 errors.
    """,
    response_model=AuthResponse,
)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str = Depends(get_refresh_token_from_cookie),
):
    if not refresh_token:
        raise AuthenticationError("No refresh token provided")

    user, new_access_token, new_refresh_token = auth_service.refresh_tokens(
        db, refresh_token=refresh_token
    )

    db.commit()
    _set_refresh_cookie(response, new_refresh_token)

    user_data = AuthUserResponse.from_user(user)
    return AuthResponse(
        user=user_data.model_dump_camel(),
        accessToken=new_access_token,
    )


# ── Logout ────────────────────────────────────────────────────────────────────

@auth_router.post(
    "/logout",
    summary="Logout",
    description="Revokes the refresh token and clears the cookie.",
    response_model=MessageResponse,
)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    refresh_token: str = Depends(get_refresh_token_from_cookie),
):
    ip = request.client.host if request.client else None

    auth_service.logout(
        db,
        refresh_token=refresh_token,
        user_id=current_user.id,
        user_name=current_user.name,
        ip_address=ip,
    )

    db.commit()
    _clear_refresh_cookie(response)

    return MessageResponse(message="Logged out successfully")


# ── Forgot Password ───────────────────────────────────────────────────────────

@auth_router.post(
    "/forgot-password",
    summary="Request password reset email",
    response_model=MessageResponse,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Send a password reset email.
    Returns the same response whether the email exists or not
    (prevents email enumeration).

    TODO: Implement SMTP email sending in Phase 2 extension.
    """
    # Always return success — don't reveal whether email exists
    return MessageResponse(
        message="If an account exists with that email, you'll receive a reset link shortly."
    )


# ── Reset Password ────────────────────────────────────────────────────────────

@auth_router.post(
    "/reset-password",
    summary="Reset password with token",
    response_model=MessageResponse,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    TODO: Implement password reset in Phase 2 extension.
    """
    return MessageResponse(message="Password reset successfully")


# ── Get Current User (mounted at /me, not /auth/me) ──────────────────────────
# IMPORTANT: The frontend's authService.getMe() calls GET /me (not /auth/me)
# So we mount this on the plain router (no /auth prefix)

@router.get(
    "/me",
    summary="Get current authenticated user",
    description="Returns the profile of the currently authenticated user.",
)
def get_me(current_user=Depends(get_current_user)):
    """
    GET /api/v1/me

    The frontend calls this on app startup to restore the auth session:
      useAuthInit() → authService.getMe() → GET /api/v1/me

    Returns the same AuthUser shape as login/register.
    """
    user_data = AuthUserResponse.from_user(current_user)
    return user_data.model_dump_camel()


# Alias: also respond at /auth/me (some docs/tests reference this URL)
@auth_router.get(
    "/me",
    summary="Get current authenticated user (alias)",
    description="Returns the profile of the currently authenticated user. Alias of GET /api/v1/me.",
)
def get_me_alias(current_user=Depends(get_current_user)):
    user_data = AuthUserResponse.from_user(current_user)
    return user_data.model_dump_camel()
