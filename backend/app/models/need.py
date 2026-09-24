"""
app/models/need.py
──────────────────────────────────────────────────────────────────────────────
Need model — a verified recipient's declaration of a medicine need.

Needs are matched against active listings to generate claim opportunities.

LIFECYCLE:
  ACTIVE    → Need is live and being matched
  MATCHED   → A matching listing has been found (claim created)
  FULFILLED → A claim from this need was completed
  EXPIRED   → Need expiry date passed without fulfillment
  CANCELLED → Recipient manually cancelled

TABLE: needs
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, Enum as SAEnum, func, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.utils.enums import NeedStatus, UrgencyLevel


class Need(Base):
    __tablename__ = "needs"

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
    )

    medicine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("medicines.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # ── Need Details ──────────────────────────────────────────────────────────
    quantity_needed: Mapped[int] = mapped_column(Integer, nullable=False)

    urgency: Mapped[UrgencyLevel] = mapped_column(
        SAEnum(UrgencyLevel, name="urgencylevel", create_type=True),
        nullable=False,
    )

    # Location
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # How many active listings match this need (denormalized counter, refreshed by service)
    match_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Status & Timestamps ───────────────────────────────────────────────────
    status: Mapped[NeedStatus] = mapped_column(
        SAEnum(NeedStatus, name="needstatus", create_type=True),
        nullable=False,
        default=NeedStatus.ACTIVE,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
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

    # ── Relationships ─────────────────────────────────────────────────────────
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id])
    medicine: Mapped["Medicine"] = relationship("Medicine", back_populates="needs")

    __table_args__ = (
        Index("ix_needs_recipient_status", "recipient_id", "status"),
        Index("ix_needs_medicine_status", "medicine_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Need id={self.id} medicine_id={self.medicine_id} urgency={self.urgency}>"
