"""
app/models/claim.py
──────────────────────────────────────────────────────────────────────────────
Claim model for MongoDB collection `claims`.
"""

from typing import Optional, Dict, Any
from app.models.base import BaseDocument
from app.utils.enums import ClaimStatus


class Claim(BaseDocument):
    def __init__(
        self,
        listing_id: str = "",
        recipient_id: str = "",
        requested_quantity: int = 1,
        urgency_reason: Optional[str] = None,
        intended_use: Optional[str] = None,
        status: ClaimStatus = ClaimStatus.PENDING,
        donor_notes: Optional[str] = None,
        rejection_reason: Optional[str] = None,
        pickup_scheduled_at: Any = None,
        completed_at: Any = None,
        cancelled_at: Any = None,
        listing: Optional[Dict[str, Any]] = None,
        recipient: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        super().__init__(
            listing_id=str(listing_id),
            recipient_id=str(recipient_id),
            requested_quantity=requested_quantity,
            urgency_reason=urgency_reason,
            intended_use=intended_use,
            status=status if isinstance(status, str) else (status.value if hasattr(status, "value") else str(status)),
            donor_notes=donor_notes,
            rejection_reason=rejection_reason,
            pickup_scheduled_at=pickup_scheduled_at,
            completed_at=completed_at,
            cancelled_at=cancelled_at,
            listing=listing or {},
            recipient=recipient or {},
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<Claim id={self.id} status={self.status}>"
