"""
app/models/verification_submission.py
──────────────────────────────────────────────────────────────────────────────
VerificationSubmission model — a recipient's request to be verified.

When a RECIPIENT registers, their verification_status starts at PENDING.
They must submit this form with:
  - Registration number of their organization
  - A supporting document (PDF or image)

Admin then reviews and sets status to APPROVED or REJECTED.

Only APPROVED recipients can create claims.

TABLE: verification_submissions
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, Enum as SAEnum, func, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.utils.enums import VerificationStatus


class VerificationSubmission(Base):
    __tablename__ = "verification_submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,  # One submission per recipient at a time
    )

    # ── Submission Details ────────────────────────────────────────────────────
    # Organization registration number (from country authority)
    registration_number: Mapped[str] = mapped_column(String(200), nullable=False)

    # Path/URL to uploaded document (stored in local uploads/ or S3)
    document_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Original filename of uploaded document (for display)
    document_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    # ── Status & Review ───────────────────────────────────────────────────────
    status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, name="verificationstatus", create_type=True),
        nullable=False,
        default=VerificationStatus.PENDING,
        index=True,
    )

    # Admin who reviewed (optional — may be null if still pending)
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id])
    reviewed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by_id])

    def __repr__(self) -> str:
        return f"<VerificationSubmission id={self.id} recipient_id={self.recipient_id} status={self.status}>"
