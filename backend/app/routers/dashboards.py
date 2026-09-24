"""
app/routers/dashboards.py
──────────────────────────────────────────────────────────────────────────────
Dashboard endpoints for MongoDB.
"""

from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.db.session import get_db
from app.core.dependencies import require_donor, require_recipient
from app.models.listing import Listing
from app.models.user import User

router = APIRouter(tags=["Dashboards"])


@router.get("/donor/dashboard", summary="Donor dashboard stats")
def donor_dashboard(
    db: Database = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    uid = str(current_user.id)
    donor_query = {"donor_id": uid, "status": {"$ne": "REMOVED"}}

    total_listings = db["listings"].count_documents(donor_query)
    active = db["listings"].count_documents({"donor_id": uid, "status": "ACTIVE"})
    claim_pending = db["listings"].count_documents({"donor_id": uid, "status": "CLAIM_PENDING"})
    claimed = db["listings"].count_documents({"donor_id": uid, "status": "CLAIMED"})
    completed = db["listings"].count_documents({"donor_id": uid, "status": "COMPLETED"})
    expired = db["listings"].count_documents({"donor_id": uid, "status": "EXPIRED"})

    # Donor listing IDs
    listing_docs = list(db["listings"].find({"donor_id": uid}, {"_id": 1, "id": 1}))
    listing_ids = [str(d.get("id") or d.get("_id")) for d in listing_docs]

    pending_claims = db["claims"].count_documents({
        "listing_id": {"$in": listing_ids},
        "status": "PENDING",
    })

    urgency_counts = {
        "LOW": db["listings"].count_documents({"donor_id": uid, "status": "ACTIVE", "urgency": "LOW"}),
        "MEDIUM": db["listings"].count_documents({"donor_id": uid, "status": "ACTIVE", "urgency": "MEDIUM"}),
        "HIGH": db["listings"].count_documents({"donor_id": uid, "status": "ACTIVE", "urgency": "HIGH"}),
        "CRITICAL": db["listings"].count_documents({"donor_id": uid, "status": "ACTIVE", "urgency": "CRITICAL"}),
        "EXPIRED": db["listings"].count_documents({"donor_id": uid, "status": "ACTIVE", "urgency": "EXPIRED"}),
    }

    # Sum of completed claim quantities
    completed_claims_cursor = db["claims"].find({
        "listing_id": {"$in": listing_ids},
        "status": "COMPLETED",
    })
    total_donated = sum(int(c.get("requested_quantity", 0)) for c in completed_claims_cursor)

    recent_cursor = db["listings"].find({"donor_id": uid, "status": "ACTIVE"}).sort("created_at", -1).limit(5)
    recent_active = []
    for l in recent_cursor:
        recent_active.append({
            "id": str(l.get("id") or l.get("_id")),
            "expiryDate": str(l.get("expiry_date", "")),
            "urgency": str(l.get("urgency", "NORMAL")),
            "status": str(l.get("status", "ACTIVE")),
            "city": str(l.get("city", "")),
            "state": str(l.get("state", "")),
            "quantity": l.get("quantity", 0),
            "quantityAvailable": l.get("quantity_available", 0),
        })

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
        "recentActiveListings": recent_active,
    }


@router.get("/recipient/dashboard", summary="Recipient dashboard stats")
def recipient_dashboard(
    db: Database = Depends(get_db),
    current_user: User = Depends(require_recipient),
):
    uid = str(current_user.id)
    v_status = current_user.verification_status if isinstance(current_user.verification_status, str) else getattr(current_user.verification_status, "value", None)

    total_claims = db["claims"].count_documents({"recipient_id": uid})
    pending_claims = db["claims"].count_documents({"recipient_id": uid, "status": "PENDING"})
    confirmed_claims = db["claims"].count_documents({"recipient_id": uid, "status": "CONFIRMED"})
    completed_claims = db["claims"].count_documents({"recipient_id": uid, "status": "COMPLETED"})
    cancelled_claims = db["claims"].count_documents({"recipient_id": uid, "status": "CANCELLED"})

    total_needs = db["needs"].count_documents({"recipient_id": uid})
    active_needs = db["needs"].count_documents({"recipient_id": uid, "status": {"$in": ["ACTIVE", "OPEN"]}})
    fulfilled_needs = db["needs"].count_documents({"recipient_id": uid, "status": "FULFILLED"})

    completed_claims_cursor = db["claims"].find({"recipient_id": uid, "status": "COMPLETED"})
    total_received = sum(int(c.get("requested_quantity", 0)) for c in completed_claims_cursor)

    available_matches = db["listings"].count_documents({"status": "ACTIVE"})

    return {
        "totalListings": 0,
        "activeListings": 0,
        "completedTransfers": completed_claims,
        "expiredListings": 0,
        "availableMatches": available_matches,
        "activeClaims": pending_claims + confirmed_claims,
        "pendingNeeds": active_needs,
        "verificationStatus": v_status,
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
