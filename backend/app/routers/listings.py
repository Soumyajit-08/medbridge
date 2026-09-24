"""
app/routers/listings.py
──────────────────────────────────────────────────────────────────────────────
Listing endpoints — the core feature of MedBridge.

GET    /listings            → Browse all active listings (paginated + filtered)
POST   /listings            → Donor creates a new listing (multipart/form-data)
GET    /listings/{id}       → Get listing detail
PATCH  /listings/{id}       → Donor updates listing
DELETE /listings/{id}       → Donor removes listing
POST   /listings/{id}/report → User reports a listing

All write operations require authentication.
Read operations (GET list, GET detail) require authentication.
"""

import uuid
import os
import shutil
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_donor
from app.models.listing import Listing
from app.models.medicine import Medicine
from app.models.report import Report
from app.models.user import User
from app.utils.enums import ListingStatus, UrgencyLevel, PackagingCondition, AuditEvent, ReportReason
from app.utils.exceptions import ResourceNotFoundError, AuthorizationError, BusinessRuleError
from app.repositories.audit_repository import audit_repository

router = APIRouter(prefix="/listings", tags=["Listings"])

# ── Upload directory ──────────────────────────────────────────────────────────
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads/listings"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE_MB = 5


def compute_urgency(expiry_date: date) -> UrgencyLevel:
    """Compute urgency level from days until expiry."""
    today = datetime.now(timezone.utc).date()
    days = (expiry_date - today).days
    if days <= 0:
        return UrgencyLevel.EXPIRED
    elif days <= 3:
        return UrgencyLevel.CRITICAL
    elif days <= 7:
        return UrgencyLevel.HIGH
    elif days <= 30:
        return UrgencyLevel.MEDIUM
    else:
        return UrgencyLevel.LOW


def listing_to_dict(listing: Listing, include_donor: bool = True) -> dict:
    """Serialize a listing to a dict matching the frontend Listing type."""
    from datetime import date
    days_remaining = (listing.expiry_date - date.today()).days if listing.expiry_date else 0
    donor_name = listing.donor.name if (hasattr(listing, 'donor') and listing.donor) else ""
    donor_type = listing.donor.donor_type.value if (hasattr(listing, 'donor') and listing.donor and listing.donor.donor_type) else "HOUSEHOLD"
    donor_phone = listing.donor.phone if (hasattr(listing, 'donor') and listing.donor) else ""
    donor_email = listing.donor.email if (hasattr(listing, 'donor') and listing.donor) else ""

    result = {
        "id": str(listing.id),
        "donorId": str(listing.donor_id),
        "donorName": donor_name,
        "donorType": donor_type,
        "donorPhone": donor_phone,
        "donorEmail": donor_email,
        "medicineId": str(listing.medicine_id),
        "batchNumber": listing.batch_number,
        "expiryDate": listing.expiry_date.isoformat(),
        "daysRemaining": max(0, days_remaining),
        "quantity": listing.quantity,
        "quantityAvailable": listing.quantity_available,
        "packagingCondition": listing.packaging_condition.value,
        "storageConfirmed": listing.storage_confirmed,
        "safetyChecklist": listing.safety_checklist or {},
        "eligibilityScreeningPassed": listing.eligibility_screening_passed,
        "imageUrl": listing.image_url,
        "city": listing.city,
        "state": listing.state,
        "postalCode": listing.postal_code,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "location": {
            "city": listing.city or "",
            "state": listing.state or "",
            "postalCode": listing.postal_code or "",
            "approximateDistanceKm": None,
        },
        "urgency": listing.urgency.value,
        "status": listing.status.value,
        "createdAt": listing.created_at.isoformat(),
        "updatedAt": listing.updated_at.isoformat(),
    }

    # Include medicine details if loaded
    if hasattr(listing, 'medicine') and listing.medicine:
        result["medicine"] = {
            "id": str(listing.medicine.id),
            "name": listing.medicine.name,
            "genericName": listing.medicine.generic_name,
            "category": listing.medicine.category,
            "manufacturer": listing.medicine.manufacturer,
            "dosageForm": listing.medicine.dosage_form,
            "strength": listing.medicine.strength,
            "isRestricted": listing.medicine.is_restricted,
        }

    # Include donor info
    if include_donor and hasattr(listing, 'donor') and listing.donor:
        result["donor"] = {
            "id": str(listing.donor.id),
            "name": listing.donor.name,
            "email": listing.donor.email,
            "phone": listing.donor.phone,
            "donorType": listing.donor.donor_type.value if listing.donor.donor_type else None,
        }

    return result


def save_upload(file: UploadFile, listing_id: str) -> str:
    """Save uploaded file and return relative path."""
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    filename = f"{listing_id}{ext}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return f"/uploads/listings/{filename}"


# ── GET /listings ─────────────────────────────────────────────────────────────
@router.get("", summary="Browse listings")
def get_listings(
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    medicine_id: Optional[str] = Query(None, alias="medicineId"),
    mine: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/v1/listings

    Browse all listings with optional filters.
    Donor: can filter mine=true to see only their own.
    Recipient: sees all ACTIVE listings.
    Admin: sees all listings.
    """
    query = db.query(Listing).options(
        joinedload(Listing.medicine),
        joinedload(Listing.donor),
    )

    # Default: show only ACTIVE unless overridden
    if mine and current_user.role.value == "DONOR":
        query = query.filter(Listing.donor_id == current_user.id, Listing.status != ListingStatus.REMOVED)
        if status:
            try:
                query = query.filter(Listing.status == ListingStatus(status))
            except ValueError:
                pass
    elif current_user.role.value == "ADMIN":
        if status:
            try:
                query = query.filter(Listing.status == ListingStatus(status))
            except ValueError:
                pass
    else:
        # Recipients and others see only ACTIVE
        query = query.filter(Listing.status == ListingStatus.ACTIVE)

    if urgency:
        try:
            query = query.filter(Listing.urgency == UrgencyLevel(urgency))
        except ValueError:
            pass

    if city:
        query = query.filter(func.lower(Listing.city).contains(city.lower()))

    if state:
        query = query.filter(func.lower(Listing.state) == state.lower())

    if medicine_id:
        try:
            query = query.filter(Listing.medicine_id == uuid.UUID(medicine_id))
        except ValueError:
            pass

    if category:
        query = query.join(Medicine).filter(
            func.lower(Medicine.category) == category.lower()
        )

    total = query.count()
    offset = (page - 1) * limit
    listings = query.order_by(Listing.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "data": [listing_to_dict(l) for l in listings],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit,
    }


# ── GET /listings/{id} ────────────────────────────────────────────────────────
@router.get("/{listing_id}", summary="Get listing detail")
def get_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        lid = uuid.UUID(listing_id)
    except ValueError:
        raise ResourceNotFoundError("Listing")

    listing = db.query(Listing).options(
        joinedload(Listing.medicine),
        joinedload(Listing.donor),
    ).filter(Listing.id == lid).first()

    if not listing:
        raise ResourceNotFoundError("Listing")

    return listing_to_dict(listing)


# ── POST /listings ────────────────────────────────────────────────────────────
@router.post("", summary="Create listing (donor)")
def create_listing(
    medicineId: str = Form(...),
    batchNumber: str = Form(...),
    expiryDate: str = Form(...),
    quantity: int = Form(...),
    packagingCondition: str = Form(...),
    storageConfirmed: bool = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    postalCode: str = Form(...),
    safetyChecklist: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    """
    POST /api/v1/listings

    Creates a new medicine listing for donation.
    Only DONOR role can create listings.
    Uses multipart/form-data to support optional image upload.
    """
    # Validate medicine exists
    med_id_str = str(medicineId).strip()
    medicine = None
    try:
        med_id = uuid.UUID(med_id_str)
        medicine = db.query(Medicine).filter(Medicine.id == med_id, Medicine.is_active == True).first()
    except ValueError:
        med_id = None

    if not medicine:
        medicine = db.query(Medicine).filter(
            func.lower(Medicine.name) == med_id_str.lower(),
            Medicine.is_active == True
        ).first()

    if not medicine:
        medicine = db.query(Medicine).filter(
            Medicine.name.ilike(f"%{med_id_str}%"),
            Medicine.is_active == True
        ).first()

    if not medicine:
        medicine = Medicine(
            name=med_id_str,
            generic_name=med_id_str,
            category="General",
            dosage_form="Tablet",
            strength="Standard",
            manufacturer="Unspecified",
        )
        db.add(medicine)
        db.flush()

    med_id = medicine.id

    # Parse expiry date
    try:
        expiry = date.fromisoformat(expiryDate)
    except ValueError:
        raise BusinessRuleError("Invalid expiry date format. Use YYYY-MM-DD")

    if expiry <= datetime.now(timezone.utc).date():
        raise BusinessRuleError("Expiry date must be in the future")

    # Parse packaging condition
    try:
        condition = PackagingCondition(packagingCondition)
    except ValueError:
        raise BusinessRuleError(f"Invalid packaging condition: {packagingCondition}")

    if condition == PackagingCondition.DAMAGED:
        raise BusinessRuleError("Damaged medicine packaging is not eligible for donation")

    # Parse safety checklist
    import json
    checklist = {}
    if safetyChecklist:
        try:
            checklist = json.loads(safetyChecklist)
        except json.JSONDecodeError:
            pass

    # Compute urgency
    urgency = compute_urgency(expiry)

    # Eligibility check
    eligible = (
        condition == PackagingCondition.SEALED_INTACT
        and storageConfirmed
        and urgency not in (UrgencyLevel.EXPIRED,)
    )

    listing_id = uuid.uuid4()

    # Save image
    image_url = None
    if image and image.filename:
        image_url = save_upload(image, str(listing_id))

    listing = Listing(
        id=listing_id,
        donor_id=current_user.id,
        medicine_id=med_id,
        batch_number=batchNumber,
        expiry_date=expiry,
        quantity=quantity,
        quantity_available=quantity,
        packaging_condition=condition,
        storage_confirmed=storageConfirmed,
        safety_checklist=checklist,
        eligibility_screening_passed=eligible,
        image_url=image_url,
        city=city,
        state=state,
        postal_code=postalCode,
        latitude=latitude,
        longitude=longitude,
        urgency=urgency,
        status=ListingStatus.ACTIVE,
    )

    db.add(listing)
    db.flush()

    audit_repository.log(
        db,
        event=AuditEvent.LISTING_CREATED,
        user_id=current_user.id,
        user_name=current_user.name,
        resource_type="Listing",
        resource_id=str(listing.id),
    )

    db.commit()
    db.refresh(listing)

    # Load relations for response
    listing = db.query(Listing).options(
        joinedload(Listing.medicine),
        joinedload(Listing.donor),
    ).filter(Listing.id == listing.id).first()

    return listing_to_dict(listing)


# ── PATCH /listings/{id} ──────────────────────────────────────────────────────
@router.patch("/{listing_id}", summary="Update listing (donor)")
def update_listing(
    listing_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    try:
        lid = uuid.UUID(listing_id)
    except ValueError:
        raise ResourceNotFoundError("Listing")

    listing = db.query(Listing).filter(Listing.id == lid).first()
    if not listing:
        raise ResourceNotFoundError("Listing")

    if str(listing.donor_id) != str(current_user.id):
        raise AuthorizationError("You can only edit your own listings")

    if listing.status not in (ListingStatus.ACTIVE,):
        raise BusinessRuleError("Can only update ACTIVE listings")

    # Allow updating city, state, postalCode, quantity
    allowed_fields = {"city", "state", "postalCode", "postal_code"}
    for key, value in payload.items():
        if key == "city":
            listing.city = value
        elif key == "state":
            listing.state = value
        elif key in ("postalCode", "postal_code"):
            listing.postal_code = value

    db.flush()

    audit_repository.log(
        db,
        event=AuditEvent.LISTING_UPDATED,
        user_id=current_user.id,
        user_name=current_user.name,
        resource_type="Listing",
        resource_id=str(listing.id),
    )

    db.commit()
    db.refresh(listing)

    listing = db.query(Listing).options(
        joinedload(Listing.medicine),
        joinedload(Listing.donor),
    ).filter(Listing.id == listing.id).first()

    return listing_to_dict(listing)


# ── DELETE /listings/{id} ─────────────────────────────────────────────────────
@router.delete("/{listing_id}", summary="Delete listing permanently (donor)")
def delete_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    try:
        lid = uuid.UUID(listing_id)
    except ValueError:
        raise ResourceNotFoundError("Listing")

    listing = db.query(Listing).filter(Listing.id == lid).first()
    if not listing:
        raise ResourceNotFoundError("Listing")

    if str(listing.donor_id) != str(current_user.id):
        raise AuthorizationError("You can only remove your own listings")

    # Clean up any related notifications, claims, and reports before permanent deletion
    from app.models.notification import Notification
    from app.models.claim import Claim
    from app.models.report import Report

    db.query(Notification).filter(Notification.listing_id == listing.id).delete()
    db.query(Claim).filter(Claim.listing_id == listing.id).delete()
    db.query(Report).filter(Report.listing_id == listing.id).delete()

    audit_repository.log(
        db,
        event=AuditEvent.LISTING_DELETED,
        user_id=current_user.id,
        user_name=current_user.name,
        resource_type="Listing",
        resource_id=str(listing.id),
    )

    db.delete(listing)
    db.commit()
    return {"message": "Listing deleted permanently"}


# ── POST /listings/{id}/report ────────────────────────────────────────────────
@router.post("/{listing_id}/report", summary="Report a listing")
def report_listing(
    listing_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        lid = uuid.UUID(listing_id)
    except ValueError:
        raise ResourceNotFoundError("Listing")

    listing = db.query(Listing).filter(Listing.id == lid).first()
    if not listing:
        raise ResourceNotFoundError("Listing")

    reason_str = payload.get("reason", "OTHER")
    try:
        reason = ReportReason(reason_str)
    except ValueError:
        reason = ReportReason.OTHER

    report = Report(
        reporter_id=current_user.id,
        listing_id=listing.id,
        reason=reason,
        description=payload.get("description"),
    )
    db.add(report)

    audit_repository.log(
        db,
        event=AuditEvent.REPORT_CREATED,
        user_id=current_user.id,
        user_name=current_user.name,
        resource_type="Listing",
        resource_id=str(listing.id),
    )

    db.commit()
    return {"message": "Report submitted successfully"}
