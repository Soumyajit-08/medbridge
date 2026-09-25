"""
app/routers/auth.py
──────────────────────────────────────────────────────────────────────────────
Authentication endpoints: register, login, refresh, logout, me.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, Response
from pymongo.database import Database

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_refresh_token_from_cookie
from app.services.auth_service import auth_service
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
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
        secure=True,
        samesite="none",
        max_age=settings.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        path="/",
        secure=True,
        samesite="none",
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


@auth_router.patch(
    "/profile",
    summary="Update current user profile",
)
@auth_router.put(
    "/profile",
    summary="Update current user profile (alias)",
)
@router.patch(
    "/profile",
    summary="Update current user profile",
)
@router.put(
    "/profile",
    summary="Update current user profile (alias)",
)
def update_profile(
    payload: UpdateProfileRequest,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = {}
    if payload.name is not None and payload.name.strip():
        updates["name"] = payload.name.strip()
    if payload.phone is not None and payload.phone.strip():
        updates["phone"] = payload.phone.strip()
    if payload.donor_type is not None:
        updates["donor_type"] = payload.donor_type.value if hasattr(payload.donor_type, "value") else str(payload.donor_type)
    if payload.organization_name is not None:
        updates["organization_name"] = payload.organization_name.strip()
    if payload.organization_type is not None:
        updates["organization_type"] = payload.organization_type.value if hasattr(payload.organization_type, "value") else str(payload.organization_type)
    if payload.address is not None:
        updates["address"] = payload.address.strip()
    if payload.city is not None:
        updates["city"] = payload.city.strip()
    if payload.state is not None:
        updates["state"] = payload.state.strip()
    if payload.pincode is not None:
        updates["pincode"] = payload.pincode.strip()

    updates["updated_at"] = datetime.now(timezone.utc)

    uid = str(current_user.id)
    db["users"].update_one(
        {"$or": [{"_id": uid}, {"id": uid}]},
        {"$set": updates}
    )

    # Automatically sync active claims and listings
    if "phone" in updates or "name" in updates or "organization_name" in updates:
        db["claims"].update_many(
            {"recipient_id": uid},
            {"$set": {
                "recipient.name": updates.get("name", current_user.name),
                "recipient.phone": updates.get("phone", current_user.phone),
                "recipient.organization_name": updates.get("organization_name", current_user.organization_name),
                "recipient_phone": updates.get("phone", current_user.phone),
            }}
        )
        db["claims"].update_many(
            {"listing.donor_id": uid},
            {"$set": {
                "listing.donor.name": updates.get("name", current_user.name),
                "listing.donor.phone": updates.get("phone", current_user.phone),
                "donor_phone": updates.get("phone", current_user.phone),
            }}
        )
        db["listings"].update_many(
            {"donor_id": uid},
            {"$set": {
                "donor.name": updates.get("name", current_user.name),
                "donor.phone": updates.get("phone", current_user.phone),
                "donor_phone": updates.get("phone", current_user.phone),
            }}
        )

    updated_doc = db["users"].find_one({"$or": [{"_id": uid}, {"id": uid}]})
    user_data = AuthUserResponse.from_user(User.from_doc(updated_doc))
    return user_data.model_dump_camel()

