"""
app/routers/claims.py
──────────────────────────────────────────────────────────────────────────────
Claim endpoints — recipient requests to receive medicine from a listing.

GET   /claims              → Get my claims (role-aware)
GET   /claims/{id}         → Get claim detail
POST  /claims              → Recipient creates a claim
PATCH /claims/{id}/confirm → Donor confirms claim
PATCH /claims/{id}/cancel  → Either party cancels
PATCH /claims/{id}/complete → Donor marks as completed
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.claim import Claim
from app.models.listing import Listing
from app.models.notification import Notification
from app.models.user import User
from app.utils.enums import (
    ClaimStatus, ListingStatus, UserRole, VerificationStatus,
    AuditEvent, NotificationType,
)
from app.utils.exceptions import (
    ResourceNotFoundError, AuthorizationError, BusinessRuleError,
)
from app.repositories.audit_repository import audit_repository

router = APIRouter(prefix="/claims", tags=["Claims"])


def claim_to_dict(claim: Claim) -> dict:
    listing = getattr(claim, 'listing', None)
    medicine = getattr(listing, 'medicine', None) if listing else None
    recipient = getattr(claim, 'recipient', None)
    donor = getattr(listing, 'donor', None) if listing else None

    result = {
        "id": str(claim.id),
        "listingId": str(claim.listing_id),
        "recipientId": str(claim.recipient_id),
        "requestedQuantity": claim.requested_quantity,
        "availableQuantity": listing.quantity_available if listing else 0,
        "recipientOrganization": (recipient.organization_name or recipient.name) if recipient else "",
        "recipientVerificationStatus": (recipient.verification_status.value if recipient and recipient.verification_status else "PENDING"),
        "donorType": (donor.donor_type.value if donor and donor.donor_type else "HOUSEHOLD"),
        "status": claim.status.value,
        "cancellationReason": claim.cancellation_reason,
        "createdAt": claim.created_at.isoformat(),
        "updatedAt": claim.updated_at.isoformat(),
        "confirmedAt": claim.confirmed_at.isoformat() if claim.confirmed_at else None,
        "completedAt": claim.completed_at.isoformat() if claim.completed_at else None,
        "cancelledAt": claim.cancelled_at.isoformat() if claim.cancelled_at else None,
    }

    if medicine:
        result["medicine"] = {
            "id": str(medicine.id),
            "name": medicine.name,
            "genericName": medicine.generic_name,
            "strength": medicine.strength,
            "category": medicine.category,
            "manufacturer": medicine.manufacturer,
            "dosageForm": medicine.dosage_form,
            "isRestricted": medicine.is_restricted,
        }

    if listing:
        result["listing"] = {
            "id": str(listing.id),
            "status": listing.status.value,
            "expiryDate": listing.expiry_date.isoformat(),
            "quantity": listing.quantity,
            "quantityAvailable": listing.quantity_available,
            "city": listing.city,
            "state": listing.state,
            "location": {
                "city": listing.city or "",
                "state": listing.state or "",
                "postalCode": listing.postal_code or "",
            },
        }
        if medicine:
            result["listing"]["medicine"] = result["medicine"]
        if donor:
            result["listing"]["donor"] = {
                "id": str(donor.id),
                "name": donor.name,
            }

    if recipient:
        result["recipient"] = {
            "id": str(recipient.id),
            "name": recipient.name,
            "organizationName": recipient.organization_name,
        }

    return result


def notify(db: Session, user_id, notif_type: NotificationType,
           title: str, message: str, listing_id=None, claim_id=None, link: str = None):
    """Create a notification for a user."""
    n = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        listing_id=listing_id,
        claim_id=claim_id,
        link=link,
    )
    db.add(n)


def load_claim(db: Session, claim_id: str):
    try:
        cid = uuid.UUID(claim_id)
    except ValueError:
        raise ResourceNotFoundError("Claim")

    claim = db.query(Claim).options(
        joinedload(Claim.listing).joinedload(Listing.medicine),
        joinedload(Claim.listing).joinedload(Listing.donor),
        joinedload(Claim.recipient),
    ).filter(Claim.id == cid).first()

    if not claim:
        raise ResourceNotFoundError("Claim")
    return claim


# ── GET /claims ───────────────────────────────────────────────────────────────
@router.get("", summary="Get my claims")
def get_claims(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Role-aware:
      - RECIPIENT: returns their own claims
      - DONOR: returns claims on their listings
    """
    query = db.query(Claim).options(
        joinedload(Claim.listing).joinedload(Listing.medicine),
        joinedload(Claim.listing).joinedload(Listing.donor),
        joinedload(Claim.recipient),
    )

    if current_user.role == UserRole.RECIPIENT:
        query = query.filter(Claim.recipient_id == current_user.id)
    elif current_user.role == UserRole.DONOR:
        query = query.join(Listing).filter(Listing.donor_id == current_user.id)
    # ADMIN: sees all

    if status:
        try:
            query = query.filter(Claim.status == ClaimStatus(status))
        except ValueError:
            pass

    total = query.count()
    offset = (page - 1) * limit
    claims = query.order_by(Claim.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "data": [claim_to_dict(c) for c in claims],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit,
    }


# ── GET /claims/{id} ──────────────────────────────────────────────────────────
@router.get("/{claim_id}", summary="Get claim detail")
def get_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = load_claim(db, claim_id)

    # Access control
    if current_user.role not in (UserRole.ADMIN,):
        if current_user.role == UserRole.RECIPIENT and str(claim.recipient_id) != str(current_user.id):
            raise AuthorizationError("Not your claim")
        if current_user.role == UserRole.DONOR and claim.listing and str(claim.listing.donor_id) != str(current_user.id):
            raise AuthorizationError("Not your listing")

    return claim_to_dict(claim)


# ── POST /claims ──────────────────────────────────────────────────────────────
@router.post("", summary="Create claim (recipient)")
def create_claim(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST /api/v1/claims
    { "listingId": "...", "requestedQuantity": 10 }

    Only verified RECIPIENT can claim.
    """
    if current_user.role != UserRole.RECIPIENT:
        raise AuthorizationError("Only recipients can create claims")

    if current_user.verification_status != VerificationStatus.APPROVED:
        raise BusinessRuleError(
            "Your account must be verified before you can claim medicines. "
            "Please submit verification documents."
        )

    listing_id_str = payload.get("listingId")
    requested_qty = payload.get("requestedQuantity", 1)

    if not listing_id_str:
        raise BusinessRuleError("listingId is required")

    try:
        lid = uuid.UUID(listing_id_str)
    except ValueError:
        raise ResourceNotFoundError("Listing")

    listing = db.query(Listing).options(
        joinedload(Listing.medicine),
        joinedload(Listing.donor),
    ).filter(Listing.id == lid).first()

    if not listing:
        raise ResourceNotFoundError("Listing")

    if listing.status != ListingStatus.ACTIVE:
        raise BusinessRuleError(f"This listing is not available (status: {listing.status.value})")

    if requested_qty > listing.quantity_available:
        raise BusinessRuleError(
            f"Requested quantity ({requested_qty}) exceeds available ({listing.quantity_available})"
        )

    # Check for existing active claim by this recipient on this listing
    existing = db.query(Claim).filter(
        Claim.listing_id == lid,
        Claim.recipient_id == current_user.id,
        Claim.status.in_([ClaimStatus.PENDING, ClaimStatus.CONFIRMED]),
    ).first()
    if existing:
        raise BusinessRuleError("You already have an active claim on this listing")

    # Create claim
    claim = Claim(
        listing_id=listing.id,
        recipient_id=current_user.id,
        requested_quantity=requested_qty,
        status=ClaimStatus.PENDING,
    )
    db.add(claim)

    # Update listing status
    listing.status = ListingStatus.CLAIM_PENDING
    db.flush()

    # Notify donor
    notify(
        db,
        user_id=listing.donor_id,
        notif_type=NotificationType.CLAIM_REQUEST,
        title="New Claim Request",
        message=f"{current_user.name} has requested {requested_qty} unit(s) of your listing.",
        listing_id=listing.id,
        claim_id=claim.id,
        link=f"/donor/claims",
    )

    audit_repository.log(
        db,
        event=AuditEvent.CLAIM_CREATED,
        user_id=current_user.id,
        user_name=current_user.name,
        resource_type="Claim",
        resource_id=str(claim.id),
    )

    db.commit()

    claim = load_claim(db, str(claim.id))
    return claim_to_dict(claim)


# ── PATCH /claims/{id}/confirm ────────────────────────────────────────────────
@router.patch("/{claim_id}/confirm", summary="Donor confirms claim")
def confirm_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = load_claim(db, claim_id)

    if current_user.role != UserRole.DONOR:
        raise AuthorizationError("Only donors can confirm claims")
    if claim.listing and str(claim.listing.donor_id) != str(current_user.id):
        raise AuthorizationError("Not your listing")
    if claim.status != ClaimStatus.PENDING:
        raise BusinessRuleError(f"Claim is {claim.status.value}, cannot confirm")

    claim.status = ClaimStatus.CONFIRMED
    claim.confirmed_at = datetime.now(timezone.utc)
    if claim.listing:
        claim.listing.status = ListingStatus.CLAIMED
    db.flush()

    notify(
        db,
        user_id=claim.recipient_id,
        notif_type=NotificationType.CLAIM_CONFIRMED,
        title="Claim Confirmed",
        message="Your claim has been confirmed by the donor. Pickup details will follow.",
        listing_id=claim.listing_id,
        claim_id=claim.id,
        link=f"/recipient/claims",
    )

    audit_repository.log(
        db, event=AuditEvent.CLAIM_CONFIRMED,
        user_id=current_user.id, user_name=current_user.name,
        resource_type="Claim", resource_id=str(claim.id),
    )

    db.commit()
    claim = load_claim(db, str(claim.id))
    return claim_to_dict(claim)


# ── PATCH /claims/{id}/cancel ─────────────────────────────────────────────────
@router.patch("/{claim_id}/cancel", summary="Cancel claim")
def cancel_claim(
    claim_id: str,
    payload: dict = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = load_claim(db, claim_id)

    if payload is None:
        payload = {}

    # Who can cancel?
    can_cancel = (
        (current_user.role == UserRole.RECIPIENT and str(claim.recipient_id) == str(current_user.id))
        or (current_user.role == UserRole.DONOR and claim.listing and str(claim.listing.donor_id) == str(current_user.id))
        or current_user.role == UserRole.ADMIN
    )
    if not can_cancel:
        raise AuthorizationError("Not authorized to cancel this claim")

    if claim.status not in (ClaimStatus.PENDING, ClaimStatus.CONFIRMED):
        raise BusinessRuleError(f"Claim is {claim.status.value}, cannot cancel")

    claim.status = ClaimStatus.CANCELLED
    claim.cancelled_at = datetime.now(timezone.utc)
    claim.cancellation_reason = payload.get("reason")

    # Return listing to ACTIVE
    if claim.listing and claim.listing.status in (ListingStatus.CLAIM_PENDING, ListingStatus.CLAIMED):
        claim.listing.status = ListingStatus.ACTIVE
    db.flush()

    # Notify the other party
    notify_user_id = (
        claim.listing.donor_id
        if current_user.role == UserRole.RECIPIENT
        else claim.recipient_id
    )
    notify(
        db,
        user_id=notify_user_id,
        notif_type=NotificationType.CLAIM_CANCELLED,
        title="Claim Cancelled",
        message=f"Claim #{str(claim.id)[:8]} has been cancelled.",
        listing_id=claim.listing_id,
        claim_id=claim.id,
    )

    audit_repository.log(
        db, event=AuditEvent.CLAIM_CANCELLED,
        user_id=current_user.id, user_name=current_user.name,
        resource_type="Claim", resource_id=str(claim.id),
        detail=claim.cancellation_reason,
    )

    db.commit()
    claim = load_claim(db, str(claim.id))
    return claim_to_dict(claim)


# ── PATCH /claims/{id}/complete ───────────────────────────────────────────────
@router.patch("/{claim_id}/complete", summary="Mark claim as completed (donor)")
def complete_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = load_claim(db, claim_id)

    if current_user.role != UserRole.DONOR:
        raise AuthorizationError("Only donors can mark claims as completed")
    if claim.listing and str(claim.listing.donor_id) != str(current_user.id):
        raise AuthorizationError("Not your listing")
    if claim.status != ClaimStatus.CONFIRMED:
        raise BusinessRuleError(f"Claim must be CONFIRMED before completing")

    claim.status = ClaimStatus.COMPLETED
    claim.completed_at = datetime.now(timezone.utc)

    if claim.listing:
        claim.listing.status = ListingStatus.COMPLETED
        # Reduce available quantity
        claim.listing.quantity_available = max(
            0, claim.listing.quantity_available - claim.requested_quantity
        )
    db.flush()

    audit_repository.log(
        db, event=AuditEvent.CLAIM_COMPLETED,
        user_id=current_user.id, user_name=current_user.name,
        resource_type="Claim", resource_id=str(claim.id),
    )

    db.commit()
    claim = load_claim(db, str(claim.id))
    return claim_to_dict(claim)
