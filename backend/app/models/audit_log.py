"""
app/models/audit_log.py
──────────────────────────────────────────────────────────────────────────────
Audit log model — immutable record of all important actions.

WHY AUDIT LOGS?
  Every important action (login, listing creation, claim, admin approval)
  is recorded here. This gives you:
  1. Security: "Who accessed what and when?"
  2. Debugging: "What happened before this error?"
  3. Compliance: Healthcare applications often require audit trails.

IMMUTABILITY:
  Audit logs should NEVER be edited or deleted (except for data retention policy).
  This is why there's no updated_at and no soft delete.

DO NOT STORE:
  - Passwords or hashes
  - Tokens or secrets
  - Sensitive personal data
  Only store: WHO, WHAT, WHEN, WHICH RESOURCE.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.utils.enums import AuditEvent


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # The type of action (from AuditEvent enum)
    # e.g., "USER_REGISTERED", "CLAIM_CONFIRMED"
    event: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Who performed this action (nullable: some events have no user, e.g., system jobs)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Human-readable name at time of action (user might be deleted later)
    user_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Which type of resource was affected (e.g., "Listing", "Claim")
    resource_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # The ID of the affected resource (stored as string to support any ID type)
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Optional extra context (e.g., rejection reason, IP address)
    # Stored as plain text — keep this short and never include secrets
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Request metadata
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)  # IPv6 max = 45 chars

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<AuditLog event={self.event} user={self.user_name} at={self.created_at}>"
