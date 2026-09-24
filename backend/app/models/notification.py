"""
app/models/notification.py
──────────────────────────────────────────────────────────────────────────────
Notification model for MongoDB collection `notifications`.
"""

from typing import Optional, Dict, Any
from app.models.base import BaseDocument


class Notification(BaseDocument):
    def __init__(
        self,
        user_id: str = "",
        title: str = "",
        message: str = "",
        type: str = "INFO",
        link: Optional[str] = None,
        is_read: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        super().__init__(
            user_id=str(user_id),
            title=title,
            message=message,
            type=type,
            link=link,
            is_read=is_read,
            metadata=metadata or {},
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<Notification id={self.id} user={self.user_id} title={self.title}>"
