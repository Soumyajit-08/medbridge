"""
app/core/constants.py
──────────────────────────────────────────────────────────────────────────────
Business rule constants for MedBridge.

WHY A SEPARATE FILE?
Magic numbers scattered through code are hard to understand and change.
By naming them here, the code becomes self-documenting:
  INSTEAD OF: if days <= 3:
  WRITE:       if days <= URGENCY_CRITICAL_DAYS:

HOW TO CHANGE A THRESHOLD:
  1. Change the value here.
  2. The entire backend picks it up automatically.
  3. Create a note in the commit message explaining why it changed.
"""

# ── API Settings ──────────────────────────────────────────────────────────────

API_V1_PREFIX = "/api/v1"

# ── Urgency Thresholds (days remaining) ───────────────────────────────────────
# These control how UrgencyLevel is calculated from days until expiry.
# See: app/services/urgency_service.py

URGENCY_LOW_MIN_DAYS = 31       # > 30 days   → LOW
URGENCY_MEDIUM_MIN_DAYS = 8     # 8–30 days   → MEDIUM
URGENCY_HIGH_MIN_DAYS = 4       # 4–7 days    → HIGH
URGENCY_CRITICAL_MIN_DAYS = 1   # 1–3 days    → CRITICAL
                                # 0 or less   → EXPIRED

# ── Urgency Score Range ───────────────────────────────────────────────────────
# A 0–100 score for sorting purposes (higher = more urgent)
URGENCY_SCORE_MAX = 100
URGENCY_SCORE_EXPIRED = 100
URGENCY_SCORE_CRITICAL = 90
URGENCY_SCORE_HIGH = 70
URGENCY_SCORE_MEDIUM = 40
URGENCY_SCORE_LOW = 10

# ── JWT ───────────────────────────────────────────────────────────────────────

JWT_ALGORITHM = "HS256"

# Token types stored in the "type" claim of the JWT payload
JWT_ACCESS_TOKEN_TYPE = "access"
JWT_REFRESH_TOKEN_TYPE = "refresh"

# ── Cookie Names ──────────────────────────────────────────────────────────────

REFRESH_TOKEN_COOKIE_NAME = "refresh_token"

# ── Password Reset ────────────────────────────────────────────────────────────

PASSWORD_RESET_TOKEN_EXPIRES_MINUTES = 30

# ── Listing Eligibility ───────────────────────────────────────────────────────
# A listing must pass ALL of these checks to have eligibility_screening_passed = True

ELIGIBILITY_MIN_DAYS_REMAINING = 7   # Must have at least 7 days left to be eligible
ELIGIBILITY_REQUIRES_BATCH_NUMBER = True
ELIGIBILITY_REQUIRES_SEALED_PACKAGING = True

# ── Matching ──────────────────────────────────────────────────────────────────

MATCH_MAX_DISTANCE_KM = 100   # Only match listings within 100 km by default
MATCH_MIN_QUANTITY_RATIO = 0.5  # A listing must have at least 50% of needed quantity

# ── Pagination ────────────────────────────────────────────────────────────────

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# ── File Upload ───────────────────────────────────────────────────────────────

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}

LOCAL_UPLOAD_DIR = "uploads"   # Relative to backend root in development

# ── Need Expiry ───────────────────────────────────────────────────────────────

NEED_DEFAULT_EXPIRY_DAYS = 30  # A need expires after 30 days if not fulfilled
