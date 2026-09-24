"""
app/models/claim.py
──────────────────────────────────────────────────────────────────────────────
Claim model — a recipient's request to receive medicines from a listing.

LIFECYCLE:
  PENDING   → Recipient submitted claim, donor hasn't confirmed yet.
  CONFIRMED → Donor confirmed — pickup is being arranged.
  COMPLETED → Medicine physically transferred — donation done.
  CANCELLED → Either party cancelled.

RULES:
  - Only APPROVED recipients can create claims.
  - Only one active claim per listing at a time (enforced in service + DB constraint).
  - Donor confirms or rejects; recipient can cancel before confirmation.
  - Completion is triggered by donor after physical handover.

TABLE: claims
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum, func, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.utils.enums import ClaimStatus


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Claim Details ─────────────────────────────────────────────────────────
    requested_quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    # Cancellation or rejection reason (optional)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ── Status & Timestamps ───────────────────────────────────────────────────
    status: Mapped[ClaimStatus] = mapped_column(
        SAEnum(ClaimStatus, name="claimstatus", create_type=True),
        nullable=False,
        default=ClaimStatus.PENDING,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    listing: Mapped["Listing"] = relationship("Listing", back_populates="claims")
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id])
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="claim", foreign_keys="[Notification.claim_id]"
    )

    __table_args__ = (
        Index("ix_claims_listing_status", "listing_id", "status"),
        Index("ix_claims_recipient_status", "recipient_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Claim id={self.id} listing_id={self.listing_id} status={self.status}>"
