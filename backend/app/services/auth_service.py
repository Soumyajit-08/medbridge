"""
app/services/auth_service.py
──────────────────────────────────────────────────────────────────────────────
Authentication service — MongoDB business logic for auth operations.
"""

import uuid
from datetime import timedelta
from typing import Optional, Tuple
from pymongo.database import Database

from app.repositories.user_repository import user_repository
from app.repositories.refresh_token_repository import refresh_token_repository
from app.repositories.audit_repository import audit_repository
from app.auth.password import hash_password, verify_password, needs_rehash
from app.auth.jwt import create_access_token, create_refresh_token, verify_refresh_token, get_user_id_from_token
from app.schemas.auth import RegisterRequest
from app.utils.enums import AuditEvent
from app.utils.exceptions import ConflictError, AuthenticationError
from app.utils.datetime_utils import utc_now, is_expired, ensure_utc
from app.core.config import settings
from app.db.mongodb import get_db, get_users_collection


class AuthService:

    def register(
        self,
        db: Optional[Database],
        payload: RegisterRequest,
        ip_address: str | None = None,
    ) -> Tuple:
        if user_repository.email_exists(db, payload.email):
            raise ConflictError(
                "An account with this email address already exists.",
                error_code="EMAIL_ALREADY_EXISTS",
            )

        password_hash = hash_password(payload.password)

        user = user_repository.create(
            db,
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            password_hash=password_hash,
            role=payload.role,
            donor_type=payload.donor_type,
            organization_name=payload.organization_name,
            organization_type=payload.organization_type,
        )

        role_str = user.role if isinstance(user.role, str) else user.role.value
        access_token = create_access_token(str(user.id), role_str)
        refresh_token = create_refresh_token(str(user.id))

        # If registering as RECIPIENT, automatically create a pending verification submission
        if role_str == "RECIPIENT":
            now = utc_now()
            col_ver = db["verification_submissions"] if db is not None else get_db()["verification_submissions"]
            sub_id = str(uuid.uuid4())
            col_ver.insert_one({
                "_id": sub_id,
                "id": sub_id,
                "user_id": str(user.id),
                "recipient_id": str(user.id),
                "organization_name": payload.organization_name or user.name,
                "organization_type": payload.organization_type.value if hasattr(payload.organization_type, "value") else (str(payload.organization_type) if payload.organization_type else "NGO"),
                "registration_number": "PENDING_SUBMISSION",
                "documents": [],
                "document_url": None,
                "document_name": "Awaiting Document Upload",
                "status": "PENDING",
                "created_at": now,
                "updated_at": now,
            })

            # Notify all administrators in real time
            col_users = db["users"] if db is not None else get_db()["users"]
            col_notif = db["notifications"] if db is not None else get_db()["notifications"]
            admins = list(col_users.find({"role": "ADMIN"}))
            org_title = payload.organization_name or user.name
            for a in admins:
                nid = str(uuid.uuid4())
                col_notif.insert_one({
                    "_id": nid,
                    "id": nid,
                    "user_id": str(a.get("_id") or a.get("id")),
                    "recipient_id": str(user.id),
                    "type": "VERIFICATION_SUBMITTED",
                    "title": f"New Verification: {org_title}",
                    "message": f"Recipient '{user.name}' ({payload.email}) registered and is awaiting verification approval.",
                    "link": "/admin/verifications",
                    "read": False,
                    "is_read": False,
                    "created_at": now,
                })

        expires_at = utc_now() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS)
        refresh_token_repository.create(
            db,
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at,
        )

        audit_repository.log(
            db,
            event=AuditEvent.USER_REGISTERED,
            user_id=user.id,
            user_name=user.name,
            resource_type="User",
            resource_id=str(user.id),
            ip_address=ip_address,
        )

        return user, access_token, refresh_token

    def login(
        self,
        db: Optional[Database],
        email: str,
        password: str,
        portal: Optional[str] = None,
        ip_address: str | None = None,
    ) -> Tuple:
        INVALID_CREDENTIALS_MSG = "Invalid email or password."

        user = user_repository.get_by_email(db, email)
        if not user:
            raise AuthenticationError(INVALID_CREDENTIALS_MSG)

        if not user.is_active:
            raise AuthenticationError("Your account has been deactivated. Please contact support.")

        if not verify_password(password, user.password_hash):
            raise AuthenticationError(INVALID_CREDENTIALS_MSG)

        role_str = user.role if isinstance(user.role, str) else user.role.value
        if portal:
            portal_upper = portal.upper()
            if portal_upper == "ADMIN" and role_str != "ADMIN":
                raise AuthenticationError(
                    "Access denied. This account does not have Administrator privileges. Please select the 'Donor & Recipient' portal."
                )
            elif portal_upper in ("USER", "DONOR", "RECIPIENT") and role_str == "ADMIN":
                raise AuthenticationError(
                    "This is an Administrator account. Please select the 'Administrator' portal to sign in."
                )

        if needs_rehash(user.password_hash):
            new_hash = hash_password(password)
            col = db["users"] if db is not None else get_users_collection()
            col.update_one({"_id": user.id}, {"$set": {"password_hash": new_hash}})
            user.password_hash = new_hash

        access_token = create_access_token(str(user.id), role_str)
        refresh_token = create_refresh_token(str(user.id))

        expires_at = utc_now() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS)
        refresh_token_repository.create(
            db,
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at,
        )

        audit_repository.log(
            db,
            event=AuditEvent.USER_LOGIN,
            user_id=user.id,
            user_name=user.name,
            ip_address=ip_address,
        )

        return user, access_token, refresh_token

    def refresh_tokens(self, db: Optional[Database], refresh_token: str) -> Tuple:
        try:
            payload = verify_refresh_token(refresh_token)
            user_id_str = get_user_id_from_token(payload)
        except AuthenticationError:
            raise AuthenticationError("Invalid or expired refresh token")

        stored_token = refresh_token_repository.get_by_token(db, refresh_token)
        if not stored_token:
            raise AuthenticationError("Refresh token not found or already revoked")

        if stored_token.expires_at and is_expired(stored_token.expires_at):
            raise AuthenticationError("Refresh token has expired")

        user = user_repository.get_by_id(db, user_id_str)
        if not user or not user.is_active:
            raise AuthenticationError("User not found or deactivated")

        refresh_token_repository.revoke(db, refresh_token)

        role_str = user.role if isinstance(user.role, str) else user.role.value
        new_access_token = create_access_token(str(user.id), role_str)
        new_refresh_token = create_refresh_token(str(user.id))

        expires_at = utc_now() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS)
        refresh_token_repository.create(
            db,
            user_id=user.id,
            token=new_refresh_token,
            expires_at=expires_at,
        )

        return user, new_access_token, new_refresh_token

    def logout(self, db: Optional[Database], refresh_token: str | None, user_id: str, user_name: str, ip_address: str | None = None) -> None:
        if refresh_token:
            refresh_token_repository.revoke(db, refresh_token)

        audit_repository.log(
            db,
            event=AuditEvent.USER_LOGOUT,
            user_id=str(user_id),
            user_name=user_name,
            ip_address=ip_address,
        )


auth_service = AuthService()
