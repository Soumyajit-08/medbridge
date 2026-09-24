"""
app/models/refresh_token.py
──────────────────────────────────────────────────────────────────────────────
RefreshToken model for MongoDB collection `refresh_tokens`.
"""

from typing import Any
from app.models.base import BaseDocument


class RefreshToken(BaseDocument):
    def __init__(
        self,
        token_hash: str = "",
        user_id: str = "",
        expires_at: Any = None,
        is_revoked: bool = False,
        ip_address: str = "",
        user_agent: str = "",
        **kwargs,
    ):
        super().__init__(
            token_hash=token_hash,
            user_id=str(user_id),
            expires_at=expires_at,
            is_revoked=is_revoked,
            ip_address=ip_address,
            user_agent=user_agent,
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<RefreshToken id={self.id} user={self.user_id}>"
