"""
app/models/need.py
──────────────────────────────────────────────────────────────────────────────
Need model for MongoDB collection `needs`.
"""

from typing import Optional, Dict, Any
from app.models.base import BaseDocument
from app.utils.enums import NeedUrgency, NeedStatus


class Need(BaseDocument):
    def __init__(
        self,
        recipient_id: str = "",
        medicine_name: str = "",
        generic_name: Optional[str] = None,
        category: Optional[str] = None,
        quantity_needed: int = 1,
        unit: str = "units",
        urgency: NeedUrgency = NeedUrgency.MEDIUM,
        reason: Optional[str] = None,
        status: NeedStatus = NeedStatus.OPEN,
        fulfilled_at: Any = None,
        recipient: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        super().__init__(
            recipient_id=str(recipient_id),
            medicine_name=medicine_name,
            generic_name=generic_name,
            category=category,
            quantity_needed=quantity_needed,
            unit=unit,
            urgency=urgency if isinstance(urgency, str) else (urgency.value if hasattr(urgency, "value") else str(urgency)),
            reason=reason,
            status=status if isinstance(status, str) else (status.value if hasattr(status, "value") else str(status)),
            fulfilled_at=fulfilled_at,
            recipient=recipient or {},
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<Need id={self.id} medicine={self.medicine_name}>"
