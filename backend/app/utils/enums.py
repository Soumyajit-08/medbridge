"""
app/utils/enums.py
──────────────────────────────────────────────────────────────────────────────
All shared Python enums for the MedBridge backend.

WHY ENUMS?
Instead of using raw strings like "DONOR" or "ACTIVE" scattered through the
code (which are easy to misspell and hard to track), we define them once here.
Every model, schema, and service imports from this file.

HOW TO ADD A NEW ENUM VALUE:
  1. Add the new value here.
  2. Create an Alembic migration to update the DB enum type.
  3. The rest of the app picks it up automatically.
"""

from enum import Enum


# ── User Roles ────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    """
    Three roles in the system.
    - DONOR:     Can create listings and manage donations.
    - RECIPIENT: Can browse listings and claim medicines.
    - ADMIN:     Full control — approvals, bans, audit logs.

    We inherit from `str` so FastAPI can serialize the enum value directly
    to JSON as a plain string like "DONOR" instead of {"value": "DONOR"}.
    """
    DONOR = "DONOR"
    RECIPIENT = "RECIPIENT"
    ADMIN = "ADMIN"


# ── Donor Types ───────────────────────────────────────────────────────────────

class DonorType(str, Enum):
    """
    What kind of donor this person/org is.
    Household = private individual donating leftover medicines.
    Pharmacy / Authorized Organization = institutional donors.
    """
    HOUSEHOLD = "HOUSEHOLD"
    PHARMACY = "PHARMACY"
    AUTHORIZED_ORGANIZATION = "AUTHORIZED_ORGANIZATION"


# ── Recipient Organization Types ──────────────────────────────────────────────

class OrganizationType(str, Enum):
    """
    The type of organization a RECIPIENT represents.
    All recipients must be verified before claiming medicines.
    """
    NGO = "NGO"
    CLINIC = "CLINIC"
    HOSPITAL = "HOSPITAL"
    AUTHORIZED_HEALTHCARE_ORGANIZATION = "AUTHORIZED_HEALTHCARE_ORGANIZATION"


# ── Verification Status ───────────────────────────────────────────────────────

class VerificationStatus(str, Enum):
    """
    A recipient starts as PENDING (just registered).
    Admin approves or rejects after reviewing their documents.
    Only APPROVED recipients can claim listings.
    """
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# ── Listing Status ────────────────────────────────────────────────────────────

class ListingStatus(str, Enum):
    """
    The lifecycle of a medicine listing:
      ACTIVE       → Listing is live and available to claim.
      CLAIM_PENDING → A recipient has submitted a claim, waiting for donor.
      CLAIMED      → Donor confirmed the claim.
      COMPLETED    → Medicine has been physically handed over.
      EXPIRED      → Expiry date passed, auto-expired by background job.
      REMOVED      → Donor manually removed/cancelled the listing.

    IMPORTANT: These values match the frontend TypeScript ListingStatus type
    exactly. Do not rename them without updating the frontend.
    """
    ACTIVE = "ACTIVE"
    CLAIM_PENDING = "CLAIM_PENDING"
    CLAIMED = "CLAIMED"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    REMOVED = "REMOVED"


# ── Urgency Levels ────────────────────────────────────────────────────────────

class UrgencyLevel(str, Enum):
    """
    How urgently a medicine needs to be claimed (based on days until expiry).
    Thresholds are configured in app/core/constants.py.

    LOW      → > 30 days remaining
    MEDIUM   → 8–30 days
    HIGH     → 4–7 days
    CRITICAL → 1–3 days
    EXPIRED  → 0 or negative days
    """
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    EXPIRED = "EXPIRED"


# ── Storage Condition ─────────────────────────────────────────────────────────

class StorageCondition(str, Enum):
    ROOM_TEMPERATURE = "ROOM_TEMPERATURE"
    REFRIGERATED = "REFRIGERATED"
    COLD_CHAIN = "COLD_CHAIN"
    FROZEN = "FROZEN"
    PROTECT_FROM_LIGHT = "PROTECT_FROM_LIGHT"


# ── Packaging Condition ───────────────────────────────────────────────────────

class PackagingCondition(str, Enum):
    """
    The physical condition of the medicine packaging.
    SEALED_INTACT = factory-sealed, never opened.
    DAMAGED       = any visible damage — ineligible by default.
    """
    SEALED_INTACT = "SEALED_INTACT"
    SEALED = "SEALED"
    OPENED_BLISTER = "OPENED_BLISTER"
    DAMAGED = "DAMAGED"


# ── Claim Status ──────────────────────────────────────────────────────────────

class ClaimStatus(str, Enum):
    """
    The lifecycle of a claim:
      PENDING   → Recipient has requested, donor has not confirmed yet.
      CONFIRMED → Donor confirmed — pickup is arranged.
      COMPLETED → Recipient picked up, transaction done.
      CANCELLED → Either party cancelled.
    """
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ── Need Status ───────────────────────────────────────────────────────────────

class NeedStatus(str, Enum):
    OPEN = "OPEN"
    ACTIVE = "ACTIVE"
    MATCHED = "MATCHED"
    FULFILLED = "FULFILLED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class NeedUrgency(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    URGENT = "URGENT"


# ── Notification Types ────────────────────────────────────────────────────────

class NotificationType(str, Enum):
    """
    Every notification sent to a user has a type.
    The frontend uses this to decide which icon/color to show.
    """
    NEW_MATCH = "NEW_MATCH"
    CLAIM_REQUEST = "CLAIM_REQUEST"
    CLAIM_CONFIRMED = "CLAIM_CONFIRMED"
    CLAIM_CANCELLED = "CLAIM_CANCELLED"
    EXPIRY_7_DAYS = "EXPIRY_7_DAYS"
    EXPIRY_3_DAYS = "EXPIRY_3_DAYS"
    EXPIRY_1_DAY = "EXPIRY_1_DAY"
    LISTING_EXPIRED = "LISTING_EXPIRED"
    VERIFICATION_APPROVED = "VERIFICATION_APPROVED"
    VERIFICATION_REJECTED = "VERIFICATION_REJECTED"
    REPORT_CREATED = "REPORT_CREATED"
    REPORT_RESOLVED = "REPORT_RESOLVED"
    PICKUP_REMINDER = "PICKUP_REMINDER"


# ── Report Reasons ───────────────────────────────────────────────────────────

class ReportReason(str, Enum):
    """
    Structured reasons a user can report a listing.
    """
    EXPIRED_MEDICINE = "EXPIRED_MEDICINE"
    COUNTERFEIT_SUSPECTED = "COUNTERFEIT_SUSPECTED"
    DAMAGED_PACKAGING = "DAMAGED_PACKAGING"
    INCORRECT_INFORMATION = "INCORRECT_INFORMATION"
    FRAUDULENT_LISTING = "FRAUDULENT_LISTING"
    SAFETY_CONCERN = "SAFETY_CONCERN"
    OTHER = "OTHER"


# ── Report Status ─────────────────────────────────────────────────────────────

class ReportStatus(str, Enum):
    PENDING = "PENDING"    # Alias for initial state (used in Report model)
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


# ── Audit Events ──────────────────────────────────────────────────────────────

class AuditEvent(str, Enum):
    """
    Every important action in the system is logged with one of these events.
    The admin panel displays these on the Audit Logs page.
    """
    # Auth
    USER_REGISTERED = "USER_REGISTERED"
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED"
    PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED"

    # Listings
    LISTING_CREATED = "LISTING_CREATED"
    LISTING_UPDATED = "LISTING_UPDATED"
    LISTING_DELETED = "LISTING_DELETED"
    LISTING_EXPIRED = "LISTING_EXPIRED"

    # Claims
    CLAIM_CREATED = "CLAIM_CREATED"
    CLAIM_CONFIRMED = "CLAIM_CONFIRMED"
    CLAIM_COMPLETED = "CLAIM_COMPLETED"
    CLAIM_CANCELLED = "CLAIM_CANCELLED"

    # Verification
    VERIFICATION_SUBMITTED = "VERIFICATION_SUBMITTED"
    VERIFICATION_APPROVED = "VERIFICATION_APPROVED"
    VERIFICATION_REJECTED = "VERIFICATION_REJECTED"

    # Reports
    REPORT_CREATED = "REPORT_CREATED"
    REPORT_RESOLVED = "REPORT_RESOLVED"

    # Needs
    NEED_CREATED = "NEED_CREATED"
    NEED_CANCELLED = "NEED_CANCELLED"

    # Admin
    USER_DEACTIVATED = "USER_DEACTIVATED"
    LISTING_REMOVED_BY_ADMIN = "LISTING_REMOVED_BY_ADMIN"
