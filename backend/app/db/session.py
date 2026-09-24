"""
app/db/session.py
──────────────────────────────────────────────────────────────────────────────
Database session dependency for FastAPI.

WHY A DEPENDENCY?
FastAPI's dependency injection system allows routers to receive a db session
automatically without having to create one manually in every route handler.

HOW IT WORKS:
  1. FastAPI calls get_db() before running a route function.
  2. get_db() creates a new database session.
  3. FastAPI passes the session into the route as `db: Session`.
  4. After the route finishes, FastAPI calls the finally block.
  5. db.close() returns the connection back to the pool.

USAGE IN A ROUTER:
  from app.db.session import get_db
  from sqlalchemy.orm import Session

  @router.get("/listings")
  def get_listings(db: Session = Depends(get_db)):
      # db is a fresh database session just for this request
      listings = db.query(Listing).all()
      return listings

REQUEST FLOW:
  HTTP Request
    → FastAPI calls get_db()
      → Session created from pool
        → Route handler runs with db
          → db.close() called (connection returned to pool)
            → HTTP Response sent
"""

from typing import Generator
from sqlalchemy.orm import Session
from app.db.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request.

    The `yield` makes this a generator, which allows FastAPI to:
    1. Run the code before `yield` → set up the session
    2. Inject `db` into the route handler
    3. Run the code after `yield` (in finally) → clean up no matter what

    The `finally` block ensures the session is ALWAYS closed,
    even if the route handler raises an exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
