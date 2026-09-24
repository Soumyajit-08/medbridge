"""
app/models/user.py
──────────────────────────────────────────────────────────────────────────────
The User SQLAlchemy model — maps to the `users` table in PostgreSQL.

WHY SQLALCHEMY MODELS?
  Python classes ↔ Database tables.
  Instead of writing raw SQL like:
    SELECT * FROM users WHERE email = 'test@example.com'
  We write Python:
    db.query(User).filter(User.email == 'test@example.com').first()

  SQLAlchemy translates Python into SQL for us.

TABLE: users
  - id:                UUID primary key (harder to enumerate than integers)
  - name:              Full display name
  - email:             Unique, used for login
  - phone:             Contact number
  - password_hash:     Argon2id hash (NEVER the plain password)
  - role:              DONOR / RECIPIENT / ADMIN
  - donor_type:        Only for DONOR role (HOUSEHOLD / PHARMACY / etc.)
  - organization_name: Only for RECIPIENT role
  - organization_type: Only for RECIPIENT role (NGO / CLINIC / HOSPITAL)
  - verification_status: Only for RECIPIENT role (PENDING / APPROVED / REJECTED)
  - is_active:         False = soft-deleted / banned user
  - avatar_url:        Optional profile photo
  - created_at / updated_at: Audit timestamps

RELATIONSHIPS:
  One User → Many Listings (donor)
  One User → Many Claims (recipient)
  One User → Many Notifications
  One User → One VerificationEvent (recipient)
  One User → Many RefreshTokens
  One User → Many AuditLogs
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.utils.enums import UserRole, DonorType, OrganizationType, VerificationStatus


class User(Base):
    __tablename__ = "users"

    # ── Primary Key ───────────────────────────────────────────────────────────
    # UUID4: random, unpredictable ID. Safer than integer IDs because:
    #   - Can't guess other users' IDs (prevents enumeration attacks)
    #   - Works across distributed systems
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Core Identity ─────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    email: Mapped[str] = mapped_column(
        String(320),  # RFC 5321 max email length
        unique=True,
        nullable=False,
        index=True,   # Index for fast login lookups
    )

    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # NEVER store a plain password. Only store the Argon2id hash.
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)

    # ── Role & Type ───────────────────────────────────────────────────────────
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="userrole", create_type=True),
        nullable=False,
    )

    # Only set for DONOR users
    donor_type: Mapped[Optional[DonorType]] = mapped_column(
        SAEnum(DonorType, name="donortype", create_type=True),
        nullable=True,
    )

    # Only set for RECIPIENT users
    organization_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    organization_type: Mapped[Optional[OrganizationType]] = mapped_column(
        SAEnum(OrganizationType, name="organizationtype", create_type=True),
        nullable=True,
    )
    verification_status: Mapped[Optional[VerificationStatus]] = mapped_column(
        SAEnum(VerificationStatus, name="verificationstatus", create_type=True),
        nullable=True,
        default=VerificationStatus.PENDING,
    )

    # ── Status ────────────────────────────────────────────────────────────────
    # Soft delete: instead of deleting the row, set is_active = False
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Profile ───────────────────────────────────────────────────────────────
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    # server_default: PostgreSQL sets this automatically when the row is created
    # onupdate: SQLAlchemy updates this on every UPDATE operation
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    # These are Python-level references — SQLAlchemy handles the JOINs.
    # back_populates: creates a two-way link (User.refresh_tokens ↔ RefreshToken.user)
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",  # Delete tokens when user is deleted
    )

    # ── Table Indexes ─────────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_users_email_lower", func.lower(email)),  # Case-insensitive email lookup
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
