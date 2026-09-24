"""
app/repositories/user_repository.py
──────────────────────────────────────────────────────────────────────────────
User repository — all database queries for the users table.

WHY A REPOSITORY LAYER?
  The repository is the ONLY place that talks to the database.
  Services call repository methods — they don't write SQL themselves.

  Benefits:
  - If we switch databases (PostgreSQL → MySQL), only this layer changes.
  - All queries are in one place — easy to find and optimize.
  - Services are easier to unit test (mock the repository).

WHAT BELONGS HERE:
  - SELECT queries (get_by_id, get_by_email)
  - INSERT operations (create)
  - UPDATE operations (update_password)
  - DELETE operations (soft delete)
  - Complex JOINs specific to users

WHAT DOES NOT BELONG HERE:
  - Business logic ("is this user allowed to do X?") → goes in services
  - Password hashing → goes in auth/password.py
  - JWT creation → goes in auth/jwt.py

USAGE IN SERVICES:
  user = user_repo.get_by_email(db, "test@example.com")
  if not user:
      raise ResourceNotFoundError("User")
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.utils.enums import UserRole, VerificationStatus


class UserRepository:
    """
    All database operations for the User model.
    Methods are simple, focused, and don't contain business logic.
    """

    def get_by_id(self, db: Session, user_id: uuid.UUID) -> Optional[User]:
        """Fetch a user by their UUID. Returns None if not found."""
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Fetch a user by email (case-insensitive).
        Used during login to find the user before verifying password.
        """
        return db.query(User).filter(
            func.lower(User.email) == email.lower().strip(),
            User.is_active == True,
        ).first()

    def email_exists(self, db: Session, email: str) -> bool:
        """Check if an email is already registered. Used during registration."""
        return db.query(User).filter(
            func.lower(User.email) == email.lower().strip()
        ).count() > 0

    def create(
        self,
        db: Session,
        *,
        name: str,
        email: str,
        phone: str,
        password_hash: str,
        role: UserRole,
        donor_type=None,
        organization_name: Optional[str] = None,
        organization_type=None,
    ) -> User:
        """
        Create a new user and save to the database.

        We use keyword-only arguments (after *) to prevent mistakes
        from positional argument order.

        The verification_status is auto-set:
          - RECIPIENT → PENDING (must be approved before claiming)
          - DONOR → None (donors don't need verification)
        """
        verification_status = None
        if role == UserRole.RECIPIENT:
            verification_status = VerificationStatus.PENDING

        user = User(
            name=name,
            email=email.lower().strip(),
            phone=phone,
            password_hash=password_hash,
            role=role,
            donor_type=donor_type,
            organization_name=organization_name,
            organization_type=organization_type,
            verification_status=verification_status,
        )

        db.add(user)
        db.flush()   # Write to DB transaction (but don't commit yet)
                     # This gives us user.id before committing
        return user

    def update_verification_status(
        self,
        db: Session,
        user_id: uuid.UUID,
        status: VerificationStatus,
    ) -> Optional[User]:
        """Update a recipient's verification status (admin action)."""
        user = self.get_by_id(db, user_id)
        if user:
            user.verification_status = status
            db.flush()
        return user

    def deactivate(self, db: Session, user_id: uuid.UUID) -> Optional[User]:
        """Soft-delete a user (set is_active = False)."""
        user = self.get_by_id(db, user_id)
        if user:
            user.is_active = False
            db.flush()
        return user

    def get_all(
        self,
        db: Session,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[User], int]:
        """Get all active users with total count (for admin panel)."""
        query = db.query(User).filter(User.is_active == True)
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
        return users, total


# Singleton instance — import and use this directly
user_repository = UserRepository()
