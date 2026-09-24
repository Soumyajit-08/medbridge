"""
app/models/medicine.py
──────────────────────────────────────────────────────────────────────────────
Medicine catalogue model.

A Medicine is a pre-seeded or admin-managed record representing a drug.
Listings reference a Medicine by foreign key.
The frontend searches medicines by name/generic name for autocomplete.

TABLE: medicines
  - id:           UUID primary key
  - name:         Brand name (e.g., "Paracetamol")
  - generic_name: INN/generic name (e.g., "Acetaminophen")
  - category:     Therapeutic category (e.g., "Analgesic")
  - manufacturer: Manufacturer name
  - dosage_form:  Tablet / Capsule / Syrup / Injection / etc.
  - strength:     e.g., "500mg", "250mg/5ml"
  - is_restricted: True = restricted medicine — extra scrutiny required
  - is_active:    Soft delete
  - created_at / updated_at
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Text, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # Brand name (shown in autocomplete)
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)

    # International Non-proprietary Name
    generic_name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)

    # Therapeutic category
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Manufacturer name
    manufacturer: Mapped[str] = mapped_column(String(300), nullable=False)

    # Tablet, Capsule, Syrup, etc.
    dosage_form: Mapped[str] = mapped_column(String(100), nullable=False)

    # e.g., "500mg", "250mg/5ml"
    strength: Mapped[str] = mapped_column(String(100), nullable=False)

    # Medicines flagged as restricted require additional admin scrutiny
    is_restricted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

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

    # Relationships
    listings: Mapped[list["Listing"]] = relationship("Listing", back_populates="medicine")
    needs: Mapped[list["Need"]] = relationship("Need", back_populates="medicine")

    # Full-text search index on name + generic_name
    __table_args__ = (
        Index("ix_medicines_name_trgm", "name"),
        Index("ix_medicines_generic_name_trgm", "generic_name"),
    )

    def __repr__(self) -> str:
        return f"<Medicine id={self.id} name={self.name} strength={self.strength}>"
