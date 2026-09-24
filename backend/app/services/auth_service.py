"""
app/services/auth_service.py
──────────────────────────────────────────────────────────────────────────────
Authentication service — all business logic for auth operations.

WHY A SERVICE LAYER?
  The service layer sits between routers and repositories.
  It contains the business rules and orchestration logic.

  Router (HTTP) → Service (business logic) → Repository (database)

WHAT BELONGS HERE:
  - "Is this email already taken?" → business rule
  - "Is this password correct?" → business rule
  - "Create tokens + store refresh token" → orchestration
  - "Is this recipient verified?" → business rule

WHAT DOES NOT BELONG HERE:
  - Raw SQL queries → goes in repositories
  - HTTP response formatting → goes in routers
  - Token creation → goes in auth/jwt.py (service calls it)

REQUEST FLOW for Registration:
  POST /api/v1/auth/register
    → RegisterRequest validated by Pydantic
      → auth_router calls auth_service.register()
        → Check if email exists (user_repository)
          → Hash the password (password.hash_password)
            → Create user in DB (user_repository.create)
              → Create access token (jwt.create_access_token)
                → Create refresh token (jwt.create_refresh_token)
                  → Store refresh token hash in DB
                    → Log audit event
                      → Return { user, access_token, refresh_token }
"""

from datetime import timedelta
from sqlalchemy.orm import Session

from app.repositories.user_repository import user_repository
from app.repositories.refresh_token_repository import refresh_token_repository
from app.repositories.audit_repository import audit_repository
from app.auth.password import hash_password, verify_password, needs_rehash
from app.auth.jwt import create_access_token, create_refresh_token, verify_refresh_token, get_user_id_from_token
from app.schemas.auth import RegisterRequest, AuthUserResponse
from app.utils.enums import AuditEvent
from app.utils.exceptions import ConflictError, AuthenticationError, BusinessRuleError
from app.utils.datetime_utils import utc_now
from app.core.config import settings
import uuid


class AuthService:
    """
    Handles all authentication business logic.

    Note: Methods take `db: Session` as first argument.
    The session is managed by FastAPI's dependency injection (get_db).
    """

    def register(
        self,
        db: Session,
        payload: RegisterRequest,
        ip_address: str | None = None,
    ) -> tuple:
        """
        Register a new user.

        Returns: (user, access_token, refresh_token)

        Business rules enforced:
          1. Email must not already exist.
          2. ADMIN role cannot be self-registered.
          3. Donor must provide donor_type.
          4. Recipient must provide organization info.
          (Rules 2-4 are enforced in the Pydantic schema)

        The caller (router) is responsible for:
          - Committing the transaction (db.commit())
          - Setting the refresh token cookie
        """
        # Rule 1: Email uniqueness check
        if user_repository.email_exists(db, payload.email):
            raise ConflictError(
                "An account with this email address already exists.",
                error_code="EMAIL_ALREADY_EXISTS",
            )

        # Hash the password — NEVER store plain text
        password_hash = hash_password(payload.password)

        # Create the user record
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

        # Create JWT tokens
        access_token = create_access_token(str(user.id), user.role.value)
        refresh_token = create_refresh_token(str(user.id))

        # Store refresh token hash in DB
        expires_at = utc_now() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS)
        refresh_token_repository.create(
            db,
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at,
        )

        # Audit log
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
        db: Session,
        email: str,
        password: str,
        ip_address: str | None = None,
    ) -> tuple:
        """
        Authenticate a user with email + password.

        Returns: (user, access_token, refresh_token)

        Security note: We return the same error for both
        "user not found" and "wrong password". This prevents
        an attacker from using login errors to enumerate which
        emails are registered.
        """
        INVALID_CREDENTIALS_MSG = "Invalid email or password."

        # Find user by email
        user = user_repository.get_by_email(db, email)
        if not user:
            raise AuthenticationError(INVALID_CREDENTIALS_MSG)

        # Check account is active
        if not user.is_active:
            raise AuthenticationError("Your account has been deactivated. Please contact support.")

        # Verify password
        if not verify_password(password, user.password_hash):
            raise AuthenticationError(INVALID_CREDENTIALS_MSG)

        # Optional: rehash with stronger parameters if needed
        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(password)
            db.flush()

        # Create tokens
        access_token = create_access_token(str(user.id), user.role.value)
        refresh_token = create_refresh_token(str(user.id))

        # Store refresh token
        expires_at = utc_now() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS)
        refresh_token_repository.create(
            db,
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at,
        )

        # Audit log
        audit_repository.log(
            db,
            event=AuditEvent.USER_LOGIN,
            user_id=user.id,
            user_name=user.name,
            ip_address=ip_address,
        )

        return user, access_token, refresh_token

    def refresh_tokens(self, db: Session, refresh_token: str) -> tuple:
        """
        Issue new tokens using a valid refresh token (rotation).

        TOKEN ROTATION:
          1. Verify the refresh token JWT signature + expiry
          2. Check it's in the DB and not revoked
          3. Revoke the old token
          4. Issue a new access + refresh token pair
          5. Store the new refresh token

        This means each refresh token can only be used ONCE.
        If a stolen token is replayed after rotation, it's already revoked → rejected.
        """
        # Step 1: Verify JWT signature + expiry
        try:
            payload = verify_refresh_token(refresh_token)
            user_id_str = get_user_id_from_token(payload)
        except AuthenticationError:
            raise AuthenticationError("Invalid or expired refresh token")

        # Step 2: Check DB — token must exist and not be revoked
        stored_token = refresh_token_repository.get_by_token(db, refresh_token)
        if not stored_token:
            raise AuthenticationError("Refresh token not found or already revoked")

        # Check expiry at DB level too
        if stored_token.expires_at < utc_now():
            raise AuthenticationError("Refresh token has expired")

        # Fetch user
        user_id = uuid.UUID(user_id_str)
        user = user_repository.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise AuthenticationError("User not found or deactivated")

        # Step 3: Revoke old token
        refresh_token_repository.revoke(db, refresh_token)

        # Step 4 & 5: Issue new tokens
        new_access_token = create_access_token(str(user.id), user.role.value)
        new_refresh_token = create_refresh_token(str(user.id))

        expires_at = utc_now() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS)
        refresh_token_repository.create(
            db,
            user_id=user.id,
            token=new_refresh_token,
            expires_at=expires_at,
        )

        return user, new_access_token, new_refresh_token

    def logout(self, db: Session, refresh_token: str | None, user_id: uuid.UUID, user_name: str, ip_address: str | None = None) -> None:
        """
        Logout: revoke the refresh token so it can't be used again.
        """
        if refresh_token:
            refresh_token_repository.revoke(db, refresh_token)

        audit_repository.log(
            db,
            event=AuditEvent.USER_LOGOUT,
            user_id=user_id,
            user_name=user_name,
            ip_address=ip_address,
        )


auth_service = AuthService()
