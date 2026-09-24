"""
app/models/listing.py
──────────────────────────────────────────────────────────────────────────────
Listing model for MongoDB collection `listings`.
"""

from typing import Optional, List, Dict, Any
from datetime import date, datetime
from app.models.base import BaseDocument
from app.utils.enums import ListingStatus, UrgencyLevel, StorageCondition


class Listing(BaseDocument):
    def __init__(
        self,
        donor_id: str = "",
        medicine_id: str = "",
        quantity_available: int = 1,
        unit: str = "units",
        batch_number: str = "",
        expiry_date: Any = None,
        manufacturing_date: Any = None,
        storage_condition: StorageCondition = StorageCondition.ROOM_TEMPERATURE,
        requires_cold_chain: bool = False,
        safety_checklist_answers: Optional[Dict[str, bool]] = None,
        eligibility_passed: bool = True,
        verification_notes: Optional[str] = None,
        urgency: UrgencyLevel = UrgencyLevel.LOW,
        status: ListingStatus = ListingStatus.ACTIVE,
        images: Optional[List[str]] = None,
        medicine: Optional[Dict[str, Any]] = None,
        donor: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        # Convert date to string or iso format if needed
        exp_val = expiry_date.isoformat() if hasattr(expiry_date, "isoformat") else str(expiry_date) if expiry_date else None
        mfg_val = manufacturing_date.isoformat() if hasattr(manufacturing_date, "isoformat") else str(manufacturing_date) if manufacturing_date else None

        super().__init__(
            donor_id=str(donor_id),
            medicine_id=str(medicine_id),
            quantity_available=quantity_available,
            unit=unit,
            batch_number=batch_number,
            expiry_date=exp_val,
            manufacturing_date=mfg_val,
            storage_condition=storage_condition if isinstance(storage_condition, str) else (storage_condition.value if hasattr(storage_condition, "value") else str(storage_condition)),
            requires_cold_chain=requires_cold_chain,
            safety_checklist_answers=safety_checklist_answers or {},
            eligibility_passed=eligibility_passed,
            verification_notes=verification_notes,
            urgency=urgency if isinstance(urgency, str) else (urgency.value if hasattr(urgency, "value") else str(urgency)),
            status=status if isinstance(status, str) else (status.value if hasattr(status, "value") else str(status)),
            images=images or [],
            medicine=medicine or {},
            donor=donor or {},
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<Listing id={self.id} status={self.status}>"
