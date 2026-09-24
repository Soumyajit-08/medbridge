"""
alembic/env.py
──────────────────────────────────────────────────────────────────────────────
Alembic environment configuration.

WHY THIS FILE?
  Alembic needs to know:
  1. Which DATABASE to connect to (we read from our .env)
  2. Which MODELS exist (so it can detect changes and generate migrations)

HOW AUTOGENERATE WORKS:
  When you run `python -m alembic revision --autogenerate -m "..."`:
    1. Alembic looks at `target_metadata` (all our SQLAlchemy models)
    2. Alembic compares the models to the current database schema
    3. Alembic generates a migration script with the differences
    4. You review the script, then run `python -m alembic upgrade head`

IMPORTANT: All models MUST be imported here (or imported by Base).
If a model is not imported, Alembic won't see it and won't migrate it.
"""

import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Add backend root to Python path ───────────────────────────────────────────
# This allows Alembic to import from app.* modules
# Alembic runs from the backend/ directory, so we add it to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Import our app config and Base ────────────────────────────────────────────
from app.core.config import settings
from app.db.base import Base

# ── Import ALL models here so Alembic can detect them ────────────────────────
# We import from app.models (the registry) so a single import covers all tables.
import app.models  # noqa: F401 — registers all models via __init__.py

# Individual imports are kept for explicit clarity and IDE support:
from app.models.user import User                              # noqa: F401
from app.models.refresh_token import RefreshToken             # noqa: F401
from app.models.audit_log import AuditLog                     # noqa: F401
from app.models.medicine import Medicine                      # noqa: F401
from app.models.listing import Listing                        # noqa: F401
from app.models.claim import Claim                            # noqa: F401
from app.models.need import Need                              # noqa: F401
from app.models.notification import Notification              # noqa: F401
from app.models.verification_submission import VerificationSubmission  # noqa: F401
from app.models.report import Report                          # noqa: F401

# ── Alembic config ────────────────────────────────────────────────────────────
config = context.config

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tell Alembic about all our table definitions
# This is what `--autogenerate` uses to detect schema changes
target_metadata = Base.metadata

# Override the database URL from our .env (not from alembic.ini)
# This way we only have ONE place to configure the database URL
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))


# ── Migration Runners ─────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """
    'Offline' mode: generate SQL scripts without connecting to the database.
    Useful for reviewing what changes will be made before applying them.

    Run with: python -m alembic upgrade head --sql
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    'Online' mode: connect to the database and apply migrations directly.

    This is what `python -m alembic upgrade head` uses.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,       # Detect column type changes
            compare_server_default=True,  # Detect default value changes
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
