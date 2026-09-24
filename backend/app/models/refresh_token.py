"""
app/models/refresh_token.py
──────────────────────────────────────────────────────────────────────────────
Refresh token model — stores issued refresh tokens in the database.

WHY STORE REFRESH TOKENS IN THE DATABASE?
  JWTs are stateless — once issued, they're valid until expiry.
  If a user's refresh token is stolen, we can't invalidate it... unless
  we store them in the DB and check on every refresh request.

  By storing refresh tokens, we can:
  1. Revoke tokens on logout (mark as revoked)
  2. Implement token rotation (issue a new token, revoke the old one)
  3. Detect reuse attacks (if a revoked token is used again, someone stole it)

TOKEN ROTATION FLOW:
  Client sends old refresh token
    → Backend verifies it's in the DB and not revoked
      → Backend issues NEW access token + NEW refresh token
        → Backend revokes the OLD refresh token
          → Client uses the new tokens

TABLE: refresh_tokens
  - id:          UUID primary key
  - user_id:     Foreign key to users table
  - token_hash:  SHA-256 hash of the token (don't store raw tokens!)
  - is_revoked:  True = this token is no longer valid
  - expires_at:  When this token expires
  - created_at:  When it was issued
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Foreign key → links this token to a specific user
    # ondelete="CASCADE": if the user is deleted, all their tokens are deleted too
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # We store a HASH of the token, not the raw token.
    # If the DB is breached, attacker can't use the hashes directly.
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    # When this token expires (matches JWT exp claim)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # Set to True on logout or token rotation
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Relationship ──────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    __table_args__ = (
        Index("ix_refresh_tokens_token_hash", "token_hash"),
    )

    def __repr__(self) -> str:
        return f"<RefreshToken id={self.id} user_id={self.user_id} revoked={self.is_revoked}>"
