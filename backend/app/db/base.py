"""
app/db/base.py
──────────────────────────────────────────────────────────────────────────────
SQLAlchemy declarative base.

WHY THIS FILE?
Every SQLAlchemy model must inherit from a common `Base` class.
This `Base` holds the metadata (table definitions, relationships).

This file is deliberately minimal — just the Base declaration.

USAGE:
  from app.db.base import Base

  class User(Base):
      __tablename__ = "users"
      ...

ALEMBIC:
  Alembic's env.py imports Base.metadata so it can detect all tables and
  generate migrations automatically.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Parent class for all SQLAlchemy ORM models.

    DeclarativeBase (SQLAlchemy 2.x) gives us:
      - Mapped[type] column annotations
      - relationship() support
      - metadata.create_all() / Alembic detection
    """
    pass
