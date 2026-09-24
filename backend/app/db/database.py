"""
app/db/database.py
──────────────────────────────────────────────────────────────────────────────
SQLAlchemy engine and session factory.

MENTAL MODEL:
  Engine     → The actual database connection (like a phone to PostgreSQL)
  Session    → A single conversation with PostgreSQL (one HTTP request = one session)
  SessionLocal → A factory that creates new Sessions on demand

WHY SEPARATE FROM base.py?
  base.py = "what tables exist" (schema)
  database.py = "how to talk to the database" (connection)

CONNECTION POOL:
  SQLAlchemy maintains a pool of reusable connections.
  pool_pre_ping=True: Before using a connection, send a quick "ping" to make
  sure it's still alive. This prevents "connection was closed" errors.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


# ── Engine ────────────────────────────────────────────────────────────────────
# create_engine() creates the connection to PostgreSQL.
# It reads DATABASE_URL from settings (which read it from .env).
#
# DATABASE_URL format:
#   postgresql+psycopg://user:password@host:port/dbname
#
# "postgresql+psycopg" means:
#   - Use PostgreSQL dialect
#   - Use psycopg (v3) as the driver library

engine = create_engine(
    settings.DATABASE_URL,
    # Before using any connection from the pool, send a lightweight ping
    # to verify the connection is still alive. Prevents stale connection errors.
    pool_pre_ping=True,
    # Max number of connections in the pool
    pool_size=10,
    # Extra connections allowed beyond pool_size when burst traffic hits
    max_overflow=20,
    # Log all SQL statements in development (disable in production)
    echo=settings.DEBUG,
)


# ── Session Factory ───────────────────────────────────────────────────────────
# sessionmaker() creates a class (not an instance) that we call to get new sessions.
# Each HTTP request should use its own session.

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,  # We control when to commit — no automatic saves
    autoflush=False,   # Don't flush until we explicitly call session.flush()
    expire_on_commit=False,  # Don't reload objects after commit (better for async)
)
