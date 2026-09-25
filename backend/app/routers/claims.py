"""
app/routers/claims.py
──────────────────────────────────────────────────────────────────────────────
Claim endpoints for MongoDB.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

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


def claim_to_dict(claim: Claim, db: Optional[Database] = None) -> dict:
    listing = claim.listing or {}
    recipient = claim.recipient or {}

    if db is not None:
        if claim.listing_id:
            doc = db["listings"].find_one({"$or": [{"_id": str(claim.listing_id)}, {"id": str(claim.listing_id)}]})
            if doc:
                listing = {**listing, **doc}
        if claim.recipient_id:
            doc = db["users"].find_one({"$or": [{"_id": str(claim.recipient_id)}, {"id": str(claim.recipient_id)}]})
            if doc:
                recipient = {**recipient, **doc}

    medicine = listing.get("medicine") or {}
    if not medicine and db is not None and listing.get("medicine_id"):
        doc = db["medicines"].find_one({"$or": [{"_id": str(listing.get("medicine_id"))}, {"id": str(listing.get("medicine_id"))}]})
        if doc:
            medicine = doc

    donor = listing.get("donor") or {}
    donor_id = listing.get("donor_id") or donor.get("_id") or donor.get("id")
    if db is not None and donor_id:
        doc = db["users"].find_one({"$or": [{"_id": str(donor_id)}, {"id": str(donor_id)}]})
        if doc:
            donor = {**donor, **doc}

    status_val = claim.status if isinstance(claim.status, str) else getattr(claim.status, "value", str(claim.status))
    created_at_val = claim.created_at.isoformat() if hasattr(claim.created_at, "isoformat") else str(claim.created_at or "")
    updated_at_val = claim.updated_at.isoformat() if hasattr(claim.updated_at, "isoformat") else str(claim.updated_at or "")

    confirmed_at_val = claim.confirmed_at.isoformat() if hasattr(claim.confirmed_at, "isoformat") and claim.confirmed_at else (str(claim.confirmed_at) if claim.confirmed_at else None)
    completed_at_val = claim.completed_at.isoformat() if hasattr(claim.completed_at, "isoformat") and claim.completed_at else (str(claim.completed_at) if claim.completed_at else None)
    cancelled_at_val = claim.cancelled_at.isoformat() if hasattr(claim.cancelled_at, "isoformat") and claim.cancelled_at else (str(claim.cancelled_at) if claim.cancelled_at else None)

    recipient_name = recipient.get("organization_name") or recipient.get("name", "")
    recipient_status = recipient.get("verification_status", "PENDING")
    donor_type = donor.get("donor_type", "HOUSEHOLD")

    med_name = medicine.get("name") or listing.get("medicine_name") or "Medicine"
    generic_name = medicine.get("generic_name") or listing.get("generic_name") or ""
    strength = medicine.get("strength") or listing.get("strength") or ""
    category = medicine.get("category") or listing.get("category") or "General"
    manufacturer = medicine.get("manufacturer") or listing.get("manufacturer") or ""
    dosage_form = medicine.get("dosage_form") or listing.get("dosage_form") or "Tablet"
    is_restricted = bool(medicine.get("is_restricted", False) or listing.get("is_restricted", False))

    donor_doc = donor or {}
    recipient_doc = recipient or {}

    donor_id_val = str(donor_doc.get("_id") or donor_doc.get("id") or listing.get("donor_id") or "")
    donor_name_val = donor_doc.get("name") or listing.get("donor_name") or "Donor"
    donor_email_val = donor_doc.get("email") or listing.get("donor_email") or ""
    donor_phone_val = donor_doc.get("phone") or listing.get("donor_phone") or ""
    donor_type_val = donor_doc.get("donor_type") or listing.get("donor_type") or donor_type or "HOUSEHOLD"
    donor_addr_val = donor_doc.get("address") or listing.get("pickup_address") or ""
    donor_city_val = donor_doc.get("city") or listing.get("city") or ""
    donor_state_val = donor_doc.get("state") or listing.get("state") or ""
    donor_pincode_val = donor_doc.get("pincode") or listing.get("pincode") or ""

    recipient_id_val = str(recipient_doc.get("_id") or recipient_doc.get("id") or claim.recipient_id or "")
    recipient_name_val = recipient_doc.get("name") or "Recipient User"
    recipient_org_val = recipient_doc.get("organization_name") or recipient_name or "Recipient Organization"
    recipient_org_type_val = recipient_doc.get("organization_type") or "NGO"
    recipient_email_val = recipient_doc.get("email") or ""
    recipient_phone_val = recipient_doc.get("phone") or ""
    recipient_addr_val = recipient_doc.get("address") or ""
    recipient_city_val = recipient_doc.get("city") or ""
    recipient_state_val = recipient_doc.get("state") or ""
    recipient_pincode_val = recipient_doc.get("pincode") or ""
    recipient_ver_val = recipient_doc.get("verification_status") or recipient_status

    result = {
        "id": str(claim.id),
        "listingId": str(claim.listing_id),
        "recipientId": str(claim.recipient_id),
        "requestedQuantity": claim.requested_quantity,
        "availableQuantity": listing.get("quantity_available", listing.get("quantity", 0)),
        "recipientOrganization": recipient_org_val,
        "recipientVerificationStatus": recipient_ver_val,
        "donorType": donor_type_val,
        "status": status_val,
        "cancellationReason": claim.cancellation_reason,
        "createdAt": created_at_val,
        "updatedAt": updated_at_val,
        "confirmedAt": confirmed_at_val,
        "completedAt": completed_at_val,
        "cancelledAt": cancelled_at_val,
        "pickupAddress": donor_addr_val,
        "pickupCity": donor_city_val,
        "pickupState": donor_state_val,
        "pickupPincode": donor_pincode_val,
        "medicine": {
            "id": str(medicine.get("_id") or medicine.get("id") or listing.get("medicine_id") or ""),
            "name": med_name,
            "genericName": generic_name,
            "strength": strength,
            "category": category,
            "manufacturer": manufacturer,
            "dosageForm": dosage_form,
            "isRestricted": is_restricted,
        },
        "donor": {
            "id": donor_id_val,
            "name": donor_name_val,
            "email": donor_email_val,
            "phone": donor_phone_val,
            "donorType": donor_type_val,
            "address": donor_addr_val,
            "city": donor_city_val,
            "state": donor_state_val,
            "pincode": donor_pincode_val,
        },
        "recipient": {
            "id": recipient_id_val,
            "name": recipient_name_val,
            "organizationName": recipient_org_val,
            "organizationType": recipient_org_type_val,
            "email": recipient_email_val,
            "phone": recipient_phone_val,
            "address": recipient_addr_val,
            "city": recipient_city_val,
            "state": recipient_state_val,
            "pincode": recipient_pincode_val,
            "verificationStatus": recipient_ver_val,
        },
    }

    if listing:
        result["listing"] = {
            "id": str(listing.get("_id") or listing.get("id")),
            "status": listing.get("status", "ACTIVE"),
            "expiryDate": listing.get("expiry_date", ""),
            "quantity": listing.get("quantity", 0),
            "quantityAvailable": listing.get("quantity_available", 0),
            "batchNumber": listing.get("batch_number", ""),
            "packagingCondition": listing.get("packaging_condition", "SEALED_INTACT"),
            "storageConditions": listing.get("storage_conditions", ""),
            "pickupAddress": donor_addr_val,
            "city": donor_city_val,
            "state": donor_state_val,
            "pincode": donor_pincode_val,
            "location": {
                "city": donor_city_val,
                "state": donor_state_val,
                "postalCode": donor_pincode_val,
            },
            "donor": result["donor"],
            "medicine": result["medicine"],
        }

    return result


def notify(db: Database, user_id, notif_type: NotificationType,
           title: str, message: str, listing_id=None, claim_id=None, link: str = None):
    n = Notification(
        user_id=str(user_id),
        type=notif_type.value if hasattr(notif_type, "value") else str(notif_type),
        title=title,
        message=message,
        listing_id=str(listing_id) if listing_id else None,
        claim_id=str(claim_id) if claim_id else None,
        link=link,
    )
    db["notifications"].insert_one(n.to_doc())


@router.get("", summary="Get my claims")
def get_claims(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = {}
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value

    if role_val == "RECIPIENT":
        query["recipient_id"] = str(current_user.id)
    elif role_val == "DONOR":
        # Find all listings by this donor
        listings_cursor = db["listings"].find({"donor_id": str(current_user.id)}, {"_id": 1, "id": 1})
        listing_ids = []
        for doc in listings_cursor:
            listing_ids.append(str(doc.get("id") or doc.get("_id")))
        query["listing_id"] = {"$in": listing_ids}

    if status:
        query["status"] = status

    total = db["claims"].count_documents(query)
    offset = (page - 1) * limit
    cursor = db["claims"].find(query).sort("created_at", -1).skip(offset).limit(limit)
    claims = [Claim.from_doc(doc) for doc in cursor]

    return {
        "data": [claim_to_dict(c, db) for c in claims],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.get("/{claim_id}", summary="Get claim detail")
def get_claim(
    claim_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = str(claim_id)
    doc = db["claims"].find_one({"$or": [{"_id": cid}, {"id": cid}]})
    if not doc:
        raise ResourceNotFoundError("Claim")

    claim = Claim.from_doc(doc)
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value

    if role_val != "ADMIN":
        if role_val == "RECIPIENT" and str(claim.recipient_id) != str(current_user.id):
            raise AuthorizationError("Not your claim")

    return claim_to_dict(claim, db)


@router.post("", summary="Create claim (recipient)")
def create_claim(
    payload: dict,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "RECIPIENT":
        raise AuthorizationError("Only recipients can create claims")

    v_status = current_user.verification_status if isinstance(current_user.verification_status, str) else getattr(current_user.verification_status, "value", "PENDING")
    if v_status != "APPROVED":
        raise BusinessRuleError(
            "Your account must be verified before you can claim medicines. "
            "Please submit verification documents."
        )

    listing_id_str = payload.get("listingId")
    requested_qty = int(payload.get("requestedQuantity", 1))

    if not listing_id_str:
        raise BusinessRuleError("listingId is required")

    lid = str(listing_id_str)
    listing_doc = db["listings"].find_one({"$or": [{"_id": lid}, {"id": lid}]})
    if not listing_doc:
        raise ResourceNotFoundError("Listing")

    listing = Listing.from_doc(listing_doc)
    if listing.status not in ("ACTIVE", "AVAILABLE"):
        raise BusinessRuleError(f"This listing is not available (status: {listing.status})")

    avail_qty = listing.quantity_available or listing.quantity or 0
    if requested_qty > avail_qty:
        raise BusinessRuleError(
            f"Requested quantity ({requested_qty}) exceeds available ({avail_qty})"
        )

    # Check for existing active claim
    existing = db["claims"].find_one({
        "listing_id": lid,
        "recipient_id": str(current_user.id),
        "status": {"$in": ["PENDING", "CONFIRMED"]},
    })
    if existing:
        raise BusinessRuleError("You already have an active claim on this listing")

    claim_id = str(uuid.uuid4())
    recipient_doc = {
        "id": str(current_user.id),
        "name": current_user.name,
        "organization_name": current_user.organization_name,
        "verification_status": v_status,
    }

    claim = Claim(
        id=claim_id,
        _id=claim_id,
        listing_id=lid,
        recipient_id=str(current_user.id),
        requested_quantity=requested_qty,
        status="PENDING",
        listing=listing_doc,
        recipient=recipient_doc,
    )
    db["claims"].insert_one(claim.to_doc())

    # Update listing status
    db["listings"].update_one(
        {"$or": [{"_id": lid}, {"id": lid}]},
        {"$set": {"status": "CLAIM_PENDING"}}
    )

    # Notify donor
    notify(
        db,
        user_id=listing.donor_id,
        notif_type=NotificationType.CLAIM_REQUEST,
        title="New Claim Request",
        message=f"{current_user.name} has requested {requested_qty} unit(s) of your listing.",
        listing_id=lid,
        claim_id=claim_id,
        link=f"/donor/claims?claimId={claim_id}",
    )

    audit_repository.log(
        db,
        event=AuditEvent.CLAIM_CREATED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="Claim",
        resource_id=claim_id,
    )

    return claim_to_dict(claim, db)


@router.patch("/{claim_id}/confirm", summary="Donor confirms claim")
def confirm_claim(
    claim_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = str(claim_id)
    doc = db["claims"].find_one({"$or": [{"_id": cid}, {"id": cid}]})
    if not doc:
        raise ResourceNotFoundError("Claim")

    claim = Claim.from_doc(doc)
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "DONOR":
        raise AuthorizationError("Only donors can confirm claims")

    if claim.status != "PENDING":
        raise BusinessRuleError(f"Claim is {claim.status}, cannot confirm")

    now = datetime.now(timezone.utc)
    db["claims"].update_one(
        {"$or": [{"_id": cid}, {"id": cid}]},
        {"$set": {"status": "CONFIRMED", "confirmed_at": now}}
    )

    if claim.listing_id:
        db["listings"].update_one(
            {"$or": [{"_id": str(claim.listing_id)}, {"id": str(claim.listing_id)}]},
            {"$set": {"status": "CLAIMED"}}
        )

    donor_name = current_user.name
    med_name = ""
    if claim.listing_id:
        list_doc = db["listings"].find_one({"$or": [{"_id": str(claim.listing_id)}, {"id": str(claim.listing_id)}]})
        if list_doc:
            med_name = list_doc.get("medicine_name") or ""

    med_label = f" for {med_name}" if med_name else ""
    notify(
        db,
        user_id=claim.recipient_id,
        notif_type=NotificationType.CLAIM_CONFIRMED,
        title="Claim Confirmed",
        message=f"Your claim{med_label} was confirmed by {donor_name}! Donor contact & pickup details are now available.",
        listing_id=claim.listing_id,
        claim_id=cid,
        link=f"/recipient/claims?claimId={cid}",
    )

    audit_repository.log(
        db,
        event=AuditEvent.CLAIM_CONFIRMED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="Claim",
        resource_id=cid,
    )

    doc["status"] = "CONFIRMED"
    doc["confirmed_at"] = now
    return claim_to_dict(Claim.from_doc(doc), db)


@router.patch("/{claim_id}/cancel", summary="Cancel claim")
def cancel_claim(
    claim_id: str,
    payload: dict = None,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = str(claim_id)
    doc = db["claims"].find_one({"$or": [{"_id": cid}, {"id": cid}]})
    if not doc:
        raise ResourceNotFoundError("Claim")

    claim = Claim.from_doc(doc)
    if payload is None:
        payload = {}

    if claim.status not in ("PENDING", "CONFIRMED"):
        raise BusinessRuleError(f"Claim is {claim.status}, cannot cancel")

    now = datetime.now(timezone.utc)
    reason = payload.get("reason", "Cancelled by user")

    db["claims"].update_one(
        {"$or": [{"_id": cid}, {"id": cid}]},
        {"$set": {"status": "CANCELLED", "cancelled_at": now, "cancellation_reason": reason}}
    )

    if claim.listing_id:
        db["listings"].update_one(
            {"$or": [{"_id": str(claim.listing_id)}, {"id": str(claim.listing_id)}]},
            {"$set": {"status": "ACTIVE"}}
        )

    doc["status"] = "CANCELLED"
    doc["cancelled_at"] = now
    doc["cancellation_reason"] = reason
    return claim_to_dict(Claim.from_doc(doc), db)


@router.patch("/{claim_id}/complete", summary="Mark claim as completed (donor)")
def complete_claim(
    claim_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = str(claim_id)
    doc = db["claims"].find_one({"$or": [{"_id": cid}, {"id": cid}]})
    if not doc:
        raise ResourceNotFoundError("Claim")

    claim = Claim.from_doc(doc)
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "DONOR":
        raise AuthorizationError("Only donors can mark claims as completed")

    if claim.status != "CONFIRMED":
        raise BusinessRuleError("Claim must be CONFIRMED before completing")

    now = datetime.now(timezone.utc)
    db["claims"].update_one(
        {"$or": [{"_id": cid}, {"id": cid}]},
        {"$set": {"status": "COMPLETED", "completed_at": now}}
    )

    if claim.listing_id:
        lid = str(claim.listing_id)
        listing_doc = db["listings"].find_one({"$or": [{"_id": lid}, {"id": lid}]})
        if listing_doc:
            current_avail = listing_doc.get("quantity_available", 0)
            new_avail = max(0, current_avail - claim.requested_quantity)
            db["listings"].update_one(
                {"$or": [{"_id": lid}, {"id": lid}]},
                {"$set": {"status": "COMPLETED", "quantity_available": new_avail}}
            )

    audit_repository.log(
        db,
        event=AuditEvent.CLAIM_COMPLETED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="Claim",
        resource_id=cid,
    )

    doc["status"] = "COMPLETED"
    doc["completed_at"] = now
    return claim_to_dict(Claim.from_doc(doc), db)
