"""
app/db/session.py
──────────────────────────────────────────────────────────────────────────────
MongoDB database dependency for FastAPI route handlers.
"""

from typing import Generator
from pymongo.database import Database
from app.db.mongodb import get_db as _get_mongo_db


def get_db() -> Generator[Database, None, None]:
    """
    FastAPI dependency that provides the MongoDB database per request.
    """
    db = _get_mongo_db()
    try:
        yield db
    finally:
        pass
