"""
app/routers/dashboards.py
──────────────────────────────────────────────────────────────────────────────
Dashboard endpoints — summary statistics for each role.

GET /donor/dashboard      → Donor summary (listings, claims, impact stats)
GET /recipient/dashboard  → Recipient summary (claims, needs, verification status)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.dependencies import require_donor, require_recipient
from app.models.listing import Listing
from app.models.claim import Claim
from app.models.need import Need
from app.models.user import User
from app.utils.enums import ListingStatus, ClaimStatus, NeedStatus, UrgencyLevel

router = APIRouter(tags=["Dashboards"])


@router.get("/donor/dashboard", summary="Donor dashboard stats")
def donor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    """
    GET /api/v1/donor/dashboard

    Returns summary statistics for the authenticated donor:
      - Total, active, claimed, completed, expired listing counts
      - Pending claims awaiting confirmation
      - Total medicines donated (completed claim qty sums)
      - Urgency breakdown
    """
    # Listing counts by status (excluding REMOVED)
    all_listings = db.query(Listing).filter(
        Listing.donor_id == current_user.id,
        Listing.status != ListingStatus.REMOVED,
    )
    total_listings = all_listings.count()
    active = all_listings.filter(Listing.status == ListingStatus.ACTIVE).count()
    claim_pending = all_listings.filter(Listing.status == ListingStatus.CLAIM_PENDING).count()
    claimed = all_listings.filter(Listing.status == ListingStatus.CLAIMED).count()
    completed = all_listings.filter(Listing.status == ListingStatus.COMPLETED).count()
    expired = all_listings.filter(Listing.status == ListingStatus.EXPIRED).count()

    # Pending claims on donor's listings
    pending_claims = (
        db.query(func.count(Claim.id))
        .join(Listing, Claim.listing_id == Listing.id)
        .filter(
            Listing.donor_id == current_user.id,
            Listing.status != ListingStatus.REMOVED,
            Claim.status == ClaimStatus.PENDING,
        )
        .scalar() or 0
    )

    # Urgency breakdown (only ACTIVE listings)
    urgency_counts = {}
    for level in UrgencyLevel:
        count = all_listings.filter(
            Listing.status == ListingStatus.ACTIVE,
            Listing.urgency == level,
        ).count()
        urgency_counts[level.value] = count

    # Total units donated (completed claims)
    total_donated = (
        db.query(func.coalesce(func.sum(Claim.requested_quantity), 0))
        .join(Listing, Claim.listing_id == Listing.id)
        .filter(
            Listing.donor_id == current_user.id,
            Claim.status == ClaimStatus.COMPLETED,
        )
        .scalar() or 0
    )

    # Recent active listings (top 5)
    recent_active = (
        db.query(Listing)
        .filter(Listing.donor_id == current_user.id, Listing.status == ListingStatus.ACTIVE)
        .order_by(Listing.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "totalListings": total_listings,
        "activeListings": active + claim_pending,
        "pendingClaims": pending_claims,
        "completedTransfers": completed,
        "expiredListings": expired,
        "listingStats": {
            "total": total_listings,
            "active": active,
            "claimPending": claim_pending,
            "claimed": claimed,
            "completed": completed,
            "expired": expired,
            "removed": 0,
        },
        "claimsStats": {
            "pending": pending_claims,
        },
        "impact": {
            "totalUnitesDonated": int(total_donated),
            "completedDonations": completed,
        },
        "urgencyBreakdown": urgency_counts,
        "recentActiveListings": [
            {
                "id": str(l.id),
                "expiryDate": l.expiry_date.isoformat(),
                "urgency": l.urgency.value,
                "status": l.status.value,
                "city": l.city,
                "state": l.state,
                "quantity": l.quantity,
                "quantityAvailable": l.quantity_available,
            }
            for l in recent_active
        ],
    }


@router.get("/recipient/dashboard", summary="Recipient dashboard stats")
def recipient_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recipient),
):
    """
    GET /api/v1/recipient/dashboard

    Returns summary statistics for the authenticated recipient:
      - Verification status
      - Claim counts by status
      - Need counts by status
      - Active matches count
    """
    verification_status = (
        current_user.verification_status.value
        if current_user.verification_status
        else None
    )

    # Claims
    all_claims = db.query(Claim).filter(Claim.recipient_id == current_user.id)
    total_claims = all_claims.count()
    pending_claims = all_claims.filter(Claim.status == ClaimStatus.PENDING).count()
    confirmed_claims = all_claims.filter(Claim.status == ClaimStatus.CONFIRMED).count()
    completed_claims = all_claims.filter(Claim.status == ClaimStatus.COMPLETED).count()
    cancelled_claims = all_claims.filter(Claim.status == ClaimStatus.CANCELLED).count()

    # Needs
    all_needs = db.query(Need).filter(Need.recipient_id == current_user.id)
    total_needs = all_needs.count()
    active_needs = all_needs.filter(Need.status == NeedStatus.ACTIVE).count()
    fulfilled_needs = all_needs.filter(Need.status == NeedStatus.FULFILLED).count()

    # Total medicines received
    total_received = (
        db.query(func.coalesce(func.sum(Claim.requested_quantity), 0))
        .filter(
            Claim.recipient_id == current_user.id,
            Claim.status == ClaimStatus.COMPLETED,
        )
        .scalar() or 0
    )

    active_need_med_ids = [n.medicine_id for n in all_needs.filter(Need.status == NeedStatus.ACTIVE).all()]
    if active_need_med_ids:
        available_matches = db.query(Listing).filter(
            Listing.medicine_id.in_(active_need_med_ids),
            Listing.status == ListingStatus.ACTIVE,
        ).count()
    else:
        available_matches = db.query(Listing).filter(Listing.status == ListingStatus.ACTIVE).count()

    return {
        "totalListings": 0,
        "activeListings": 0,
        "completedTransfers": completed_claims,
        "expiredListings": 0,
        "availableMatches": available_matches,
        "activeClaims": pending_claims + confirmed_claims,
        "pendingNeeds": active_needs,
        "verificationStatus": verification_status,
        "claimStats": {
            "total": total_claims,
            "pending": pending_claims,
            "confirmed": confirmed_claims,
            "completed": completed_claims,
            "cancelled": cancelled_claims,
        },
        "needStats": {
            "total": total_needs,
            "active": active_needs,
            "fulfilled": fulfilled_needs,
        },
        "impact": {
            "totalUnitsReceived": int(total_received),
            "completedClaims": completed_claims,
        },
    }
