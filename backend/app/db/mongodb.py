"""
app/db/mongodb.py
──────────────────────────────────────────────────────────────────────────────
MongoDB client and collection managers for MedBridge.
"""

from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
import certifi
from app.core.config import settings
import logging

logger = logging.getLogger("medbridge.db")

_client: Optional[MongoClient] = None


def get_mongo_client() -> MongoClient:
    """Returns singleton PyMongo client connected to MongoDB Atlas."""
    global _client
    if _client is None:
        mongo_url = settings.MONGODB_URL or settings.DATABASE_URL
        try:
            _client = MongoClient(
                mongo_url,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=8000,
                connectTimeoutMS=8000,
            )
        except Exception as e:
            logger.warning(f"Connecting without explicit certifi: {e}")
            _client = MongoClient(
                mongo_url,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=8000,
            )
    return _client


def get_db() -> Database:
    """Returns the MongoDB database instance."""
    client = get_mongo_client()
    return client[settings.MONGODB_DB_NAME]


get_mongodb = get_db


# ── Collection Accessors ──────────────────────────────────────────────────────

def get_users_collection() -> Collection:
    return get_db()["users"]

def get_medicines_collection() -> Collection:
    return get_db()["medicines"]

def get_listings_collection() -> Collection:
    return get_db()["listings"]

def get_claims_collection() -> Collection:
    return get_db()["claims"]

def get_needs_collection() -> Collection:
    return get_db()["needs"]

def get_verifications_collection() -> Collection:
    return get_db()["verifications"]

def get_audit_logs_collection() -> Collection:
    return get_db()["audit_logs"]

def get_notifications_collection() -> Collection:
    return get_db()["notifications"]

def get_refresh_tokens_collection() -> Collection:
    return get_db()["refresh_tokens"]

def get_reports_collection() -> Collection:
    return get_db()["reports"]
