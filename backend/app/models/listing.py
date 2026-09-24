"""
app/models/listing.py
──────────────────────────────────────────────────────────────────────────────
Listing model — a donor's medicine donation offer.

LIFECYCLE:
  ACTIVE       → Live and available
  CLAIM_PENDING → A claim has been submitted (waiting for donor confirmation)
  CLAIMED      → Donor confirmed — pickup arranged
  COMPLETED    → Medicine physically transferred — donation complete
  EXPIRED      → Expiry date passed (auto-set by background job)
  REMOVED      → Donor manually cancelled

TABLE: listings
  - id, donor_id, medicine_id
  - batch_number, expiry_date, quantity, quantity_available
  - urgency: computed from days_until_expiry (authoritative from backend)
  - packaging_condition, storage_confirmed
  - safety_checklist: JSON blob of safety checks performed
  - eligibility_screening_passed: computed boolean
  - image_url: optional photo of medicine
  - city, state, postal_code: location for matching
  - latitude, longitude: for geospatial matching (approximate)
  - status, created_at, updated_at
"""

import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Date, Integer, Float, Enum as SAEnum, JSON, func, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.utils.enums import ListingStatus, UrgencyLevel, PackagingCondition


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    donor_id: Mapped[uuid.UUID] = mapped_column(
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

    # ── Medicine Details ──────────────────────────────────────────────────────
    batch_number: Mapped[str] = mapped_column(String(100), nullable=False)

    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    quantity_available: Mapped[int] = mapped_column(Integer, nullable=False)

    # ── Condition & Safety ────────────────────────────────────────────────────
    packaging_condition: Mapped[PackagingCondition] = mapped_column(
        SAEnum(PackagingCondition, name="packagingcondition", create_type=True),
        nullable=False,
    )

    storage_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Safety checklist items (stored as JSON dict, e.g. {"identifiable": true, ...})
    safety_checklist: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Eligibility computed by backend service — authoritative
    eligibility_screening_passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Media ─────────────────────────────────────────────────────────────────
    image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # ── Location ──────────────────────────────────────────────────────────────
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)

    # Approximate coordinates for distance matching
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # ── Computed Fields (backend authoritative) ───────────────────────────────
    urgency: Mapped[UrgencyLevel] = mapped_column(
        SAEnum(UrgencyLevel, name="urgencylevel", create_type=True),
        nullable=False,
        default=UrgencyLevel.LOW,
    )

    # ── Status & Timestamps ───────────────────────────────────────────────────
    status: Mapped[ListingStatus] = mapped_column(
        SAEnum(ListingStatus, name="listingstatus", create_type=True),
        nullable=False,
        default=ListingStatus.ACTIVE,
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

    # ── Relationships ─────────────────────────────────────────────────────────
    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id])
    medicine: Mapped["Medicine"] = relationship("Medicine", back_populates="listings")
    claims: Mapped[list["Claim"]] = relationship("Claim", back_populates="listing")
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="listing", foreign_keys="[Notification.listing_id]"
    )
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="listing")

    __table_args__ = (
        Index("ix_listings_status_urgency", "status", "urgency"),
        Index("ix_listings_expiry_date", "expiry_date"),
        Index("ix_listings_donor_status", "donor_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Listing id={self.id} medicine_id={self.medicine_id} status={self.status}>"
