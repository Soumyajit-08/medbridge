"""
app/repositories/refresh_token_repository.py
──────────────────────────────────────────────────────────────────────────────
Repository for managing refresh tokens in the database.
"""

import uuid
import hashlib
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


def _hash_token(token: str) -> str:
    """
    Hash the raw JWT refresh token with SHA-256 before storing.
    We never store the raw token — only the hash.

    If the DB is compromised, the attacker gets hashes,
    not usable tokens.
    """
    return hashlib.sha256(token.encode()).hexdigest()


class RefreshTokenRepository:

    def create(
        self,
        db: Session,
        *,
        user_id: uuid.UUID,
        token: str,
        expires_at: datetime,
    ) -> RefreshToken:
        """Store a hashed refresh token in the database."""
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=_hash_token(token),
            expires_at=expires_at,
            is_revoked=False,
        )
        db.add(refresh_token)
        db.flush()
        return refresh_token

    def get_by_token(self, db: Session, token: str) -> Optional[RefreshToken]:
        """
        Find a stored refresh token by its raw value.
        We hash the incoming token and look it up by hash.
        """
        token_hash = _hash_token(token)
        return db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
        ).first()

    def revoke(self, db: Session, token: str) -> bool:
        """
        Revoke a specific refresh token (called on logout or rotation).
        Returns True if the token was found and revoked.
        """
        stored = self.get_by_token(db, token)
        if stored:
            stored.is_revoked = True
            db.flush()
            return True
        return False

    def revoke_all_for_user(self, db: Session, user_id: uuid.UUID) -> int:
        """
        Revoke ALL refresh tokens for a user.
        Used when: password change, account compromise, admin ban.
        Returns the number of tokens revoked.
        """
        count = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False,
        ).update({"is_revoked": True})
        db.flush()
        return count


refresh_token_repository = RefreshTokenRepository()
