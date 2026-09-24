"""
app/repositories/refresh_token_repository.py
──────────────────────────────────────────────────────────────────────────────
Repository for managing refresh tokens in MongoDB.
"""

import hashlib
from datetime import datetime
from typing import Optional
from pymongo.database import Database
from app.models.refresh_token import RefreshToken
from app.db.mongodb import get_refresh_tokens_collection


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class RefreshTokenRepository:

    def create(
        self,
        db: Optional[Database],
        *,
        user_id: str,
        token: str,
        expires_at: datetime,
    ) -> RefreshToken:
        col = db["refresh_tokens"] if db is not None else get_refresh_tokens_collection()
        refresh_token = RefreshToken(
            user_id=str(user_id),
            token_hash=_hash_token(token),
            expires_at=expires_at,
            is_revoked=False,
        )
        col.insert_one(refresh_token.to_doc())
        return refresh_token

    def get_by_token(self, db: Optional[Database], token: str) -> Optional[RefreshToken]:
        col = db["refresh_tokens"] if db is not None else get_refresh_tokens_collection()
        token_hash = _hash_token(token)
        doc = col.find_one({
            "token_hash": token_hash,
            "is_revoked": False,
        })
        return RefreshToken.from_doc(doc) if doc else None

    def revoke(self, db: Optional[Database], token: str) -> bool:
        col = db["refresh_tokens"] if db is not None else get_refresh_tokens_collection()
        token_hash = _hash_token(token)
        res = col.update_one(
            {"token_hash": token_hash},
            {"$set": {"is_revoked": True}}
        )
        return res.modified_count > 0

    def revoke_all_for_user(self, db: Optional[Database], user_id: str) -> int:
        col = db["refresh_tokens"] if db is not None else get_refresh_tokens_collection()
        res = col.update_many(
            {"user_id": str(user_id), "is_revoked": False},
            {"$set": {"is_revoked": True}}
        )
        return res.modified_count


refresh_token_repository = RefreshTokenRepository()
