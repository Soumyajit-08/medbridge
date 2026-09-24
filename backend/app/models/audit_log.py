"""
app/models/audit_log.py
──────────────────────────────────────────────────────────────────────────────
AuditLog model for MongoDB collection `audit_logs`.
"""

from typing import Optional, Dict, Any
from app.models.base import BaseDocument


class AuditLog(BaseDocument):
    def __init__(
        self,
        event_type: str = "",
        user_id: Optional[str] = None,
        user_name: Optional[str] = None,
        user_email: Optional[str] = None,
        role: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        super().__init__(
            event_type=event_type,
            user_id=str(user_id) if user_id else None,
            user_name=user_name,
            user_email=user_email,
            role=role,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} event={self.event_type}>"
