"""
app/models/__init__.py
──────────────────────────────────────────────────────────────────────────────
Centralised model registry.

IMPORTANT: Every model must be imported here so that:
  1. SQLAlchemy's metadata knows about all tables (needed for create_all)
  2. Alembic's env.py can auto-detect all tables when generating migrations
  3. Relationships can resolve forward references

If you add a new model file, ALWAYS add its import here.
"""

from app.models.user import User                              # noqa: F401
from app.models.refresh_token import RefreshToken             # noqa: F401
from app.models.audit_log import AuditLog                     # noqa: F401
from app.models.medicine import Medicine                      # noqa: F401
from app.models.listing import Listing                        # noqa: F401
from app.models.claim import Claim                            # noqa: F401
from app.models.need import Need                              # noqa: F401
from app.models.verification_submission import VerificationSubmission  # noqa: F401
from app.models.notification import Notification              # noqa: F401
from app.models.report import Report                          # noqa: F401
