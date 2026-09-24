"""
app/db/database.py
──────────────────────────────────────────────────────────────────────────────
MongoDB client and database export for backward compatibility.
"""

from app.db.mongodb import get_mongo_client, get_db

__all__ = ["get_mongo_client", "get_db"]
