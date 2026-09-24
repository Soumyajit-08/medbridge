"""
app/models/report.py
──────────────────────────────────────────────────────────────────────────────
Report model for MongoDB collection `reports`.
"""

from typing import Optional, Dict, Any
from app.models.base import BaseDocument


class Report(BaseDocument):
    def __init__(
        self,
        reporter_id: str = "",
        target_type: str = "",
        target_id: str = "",
        reason: str = "",
        description: Optional[str] = None,
        status: str = "PENDING",
        resolved_by_id: Optional[str] = None,
        resolution_notes: Optional[str] = None,
        resolved_at: Any = None,
        **kwargs,
    ):
        super().__init__(
            reporter_id=str(reporter_id),
            target_type=target_type,
            target_id=str(target_id),
            reason=reason,
            description=description,
            status=status,
            resolved_by_id=str(resolved_by_id) if resolved_by_id else None,
            resolution_notes=resolution_notes,
            resolved_at=resolved_at,
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<Report id={self.id} status={self.status}>"
