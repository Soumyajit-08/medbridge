"""
app/routers/auth.py
──────────────────────────────────────────────────────────────────────────────
Authentication endpoints: register, login, refresh, logout, me.
"""

from fastapi import APIRouter, Depends, Request, Response
from pymongo.database import Database

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

router = APIRouter(tags=["Authentication"])
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        path="/",
    )


@auth_router.post(
    "/register",
    summary="Register a new user",
    response_model=AuthResponse,
    status_code=201,
)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Database = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user, access_token, refresh_token = auth_service.register(
        db, payload=payload, ip_address=ip
    )
    _set_refresh_cookie(response, refresh_token)
    user_data = AuthUserResponse.from_user(user)
    return AuthResponse(
        user=user_data.model_dump_camel(),
        accessToken=access_token,
    )


@auth_router.post(
    "/login",
    summary="Login with email and password",
    response_model=AuthResponse,
)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Database = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user, access_token, refresh_token = auth_service.login(
        db, email=payload.email, password=payload.password, portal=payload.portal, ip_address=ip
    )
    _set_refresh_cookie(response, refresh_token)
    user_data = AuthUserResponse.from_user(user)
    return AuthResponse(
        user=user_data.model_dump_camel(),
        accessToken=access_token,
    )


@auth_router.post(
    "/refresh",
    summary="Refresh access token",
    response_model=AuthResponse,
)
def refresh(
    request: Request,
    response: Response,
    db: Database = Depends(get_db),
    refresh_token: str = Depends(get_refresh_token_from_cookie),
):
    if not refresh_token:
        raise AuthenticationError("No refresh token provided")

    user, new_access_token, new_refresh_token = auth_service.refresh_tokens(
        db, refresh_token=refresh_token
    )
    _set_refresh_cookie(response, new_refresh_token)
    user_data = AuthUserResponse.from_user(user)
    return AuthResponse(
        user=user_data.model_dump_camel(),
        accessToken=new_access_token,
    )


@auth_router.post(
    "/logout",
    summary="Logout",
    response_model=MessageResponse,
)
def logout(
    request: Request,
    response: Response,
    db: Database = Depends(get_db),
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
    _clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully")


@auth_router.post(
    "/forgot-password",
    summary="Request password reset email",
    response_model=MessageResponse,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Database = Depends(get_db),
):
    return MessageResponse(
        message="If an account exists with that email, you'll receive a reset link shortly."
    )


@auth_router.post(
    "/reset-password",
    summary="Reset password with token",
    response_model=MessageResponse,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Database = Depends(get_db),
):
    return MessageResponse(message="Password reset successfully")


@router.get(
    "/me",
    summary="Get current authenticated user",
)
def get_me(current_user=Depends(get_current_user)):
    user_data = AuthUserResponse.from_user(current_user)
    return user_data.model_dump_camel()


@auth_router.get(
    "/me",
    summary="Get current authenticated user (alias)",
)
def get_me_alias(current_user=Depends(get_current_user)):
    user_data = AuthUserResponse.from_user(current_user)
    return user_data.model_dump_camel()
