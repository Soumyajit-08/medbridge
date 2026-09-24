"""
app/models/report.py
──────────────────────────────────────────────────────────────────────────────
Report model — user-submitted reports on listings (safety concerns, fraud, etc.).

TABLE: reports
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Text, Enum as SAEnum, func, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.utils.enums import ReportStatus, ReportReason


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Admin who resolved (if any)
    resolved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── Report Details ────────────────────────────────────────────────────────
    reason: Mapped[ReportReason] = mapped_column(
        SAEnum(ReportReason, name="reportreason", create_type=True),
        nullable=False,
    )

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Status & Review ───────────────────────────────────────────────────────
    status: Mapped[ReportStatus] = mapped_column(
        SAEnum(ReportStatus, name="reportstatus", create_type=True),
        nullable=False,
        default=ReportStatus.PENDING,
        index=True,
    )

    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    reporter: Mapped["User"] = relationship("User", foreign_keys=[reporter_id])
    listing: Mapped["Listing"] = relationship("Listing", back_populates="reports")
    resolved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[resolved_by_id])

    def __repr__(self) -> str:
        return f"<Report id={self.id} reason={self.reason} status={self.status}>"
