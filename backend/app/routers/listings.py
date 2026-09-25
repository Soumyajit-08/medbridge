"""
app/routers/listings.py
──────────────────────────────────────────────────────────────────────────────
Listing endpoints for MongoDB.
"""

import uuid
import os
import shutil
import json
import re
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from pymongo.database import Database

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

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads/listings"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def compute_urgency(expiry_date: date) -> UrgencyLevel:
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


def _parse_date(d) -> Optional[date]:
    if not d:
        return None
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, str):
        try:
            return date.fromisoformat(d.split("T")[0])
        except Exception:
            return None
    return None


def listing_to_dict(listing: Listing, db: Optional[Database] = None) -> dict:
    exp_date = _parse_date(listing.expiry_date)
    today = datetime.now(timezone.utc).date()
    days_remaining = (exp_date - today).days if exp_date else 0

    donor_data = listing.donor or {}
    if not donor_data and db is not None and listing.donor_id:
        doc = db["users"].find_one({"$or": [{"_id": str(listing.donor_id)}, {"id": str(listing.donor_id)}]})
        if doc:
            donor_data = doc

    medicine_data = listing.medicine or {}
    if not medicine_data and db is not None and listing.medicine_id:
        doc = db["medicines"].find_one({"$or": [{"_id": str(listing.medicine_id)}, {"id": str(listing.medicine_id)}]})
        if doc:
            medicine_data = doc

    donor_name = donor_data.get("name", "")
    donor_type = donor_data.get("donor_type", "HOUSEHOLD")
    donor_phone = donor_data.get("phone", "")
    donor_email = donor_data.get("email", "")

    status_val = listing.status if isinstance(listing.status, str) else getattr(listing.status, "value", str(listing.status))
    urgency_val = listing.urgency if isinstance(listing.urgency, str) else getattr(listing.urgency, "value", str(listing.urgency))
    pkg_val = listing.packaging_condition if isinstance(listing.packaging_condition, str) else getattr(listing.packaging_condition, "value", "SEALED_INTACT")

    created_at_val = listing.created_at.isoformat() if hasattr(listing.created_at, "isoformat") else str(listing.created_at or "")
    updated_at_val = listing.updated_at.isoformat() if hasattr(listing.updated_at, "isoformat") else str(listing.updated_at or "")

    result = {
        "id": str(listing.id),
        "donorId": str(listing.donor_id),
        "donorName": donor_name,
        "donorType": donor_type,
        "donorPhone": donor_phone,
        "donorEmail": donor_email,
        "medicineId": str(listing.medicine_id),
        "batchNumber": listing.batch_number or "",
        "expiryDate": exp_date.isoformat() if exp_date else (listing.expiry_date or ""),
        "daysRemaining": max(0, days_remaining),
        "quantity": listing.quantity or listing.quantity_available or 0,
        "quantityAvailable": listing.quantity_available or listing.quantity or 0,
        "packagingCondition": pkg_val,
        "storageConfirmed": bool(listing.storage_confirmed),
        "safetyChecklist": listing.safety_checklist_answers or listing.safety_checklist or {},
        "eligibilityScreeningPassed": bool(listing.eligibility_passed or listing.eligibility_screening_passed),
        "imageUrl": listing.image_url or (listing.images[0] if listing.images else None),
        "city": listing.city or "",
        "state": listing.state or "",
        "postalCode": listing.postal_code or "",
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "location": {
            "city": listing.city or "",
            "state": listing.state or "",
            "postalCode": listing.postal_code or "",
            "approximateDistanceKm": None,
        },
        "urgency": urgency_val,
        "status": status_val,
        "createdAt": created_at_val,
        "updatedAt": updated_at_val,
    }

    if medicine_data:
        result["medicine"] = {
            "id": str(medicine_data.get("_id") or medicine_data.get("id")),
            "name": medicine_data.get("name", "Medicine"),
            "genericName": medicine_data.get("generic_name", ""),
            "category": medicine_data.get("category", "General"),
            "manufacturer": medicine_data.get("manufacturer", ""),
            "dosageForm": medicine_data.get("dosage_form", "Tablet"),
            "strength": medicine_data.get("strength", ""),
            "isRestricted": bool(medicine_data.get("is_restricted", False)),
        }

    if donor_data:
        result["donor"] = {
            "id": str(donor_data.get("_id") or donor_data.get("id")),
            "name": donor_name,
            "email": donor_email,
            "phone": donor_phone,
            "donorType": donor_type,
        }

    return result


import base64

def save_upload(file: UploadFile, listing_id: str) -> str:
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    filename = f"{listing_id}{ext}"
    file_path = UPLOAD_DIR / filename
    try:
        content = file.file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        mime_type = file.content_type or ("image/png" if ext == ".png" else "image/jpeg")
        b64_str = base64.b64encode(content).decode("utf-8")
        return f"data:{mime_type};base64,{b64_str}"
    except Exception:
        return f"/uploads/listings/{filename}"


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
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = {}
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value

    if mine and role_val == "DONOR":
        query["donor_id"] = str(current_user.id)
        query["status"] = {"$ne": "REMOVED"}
        if status:
            query["status"] = status
    elif role_val == "ADMIN":
        if status:
            query["status"] = status
    else:
        # Show active or available
        query["status"] = {"$in": ["ACTIVE", "AVAILABLE"]}

    if urgency:
        query["urgency"] = urgency

    if city:
        query["city"] = {"$regex": re.escape(city.strip()), "$options": "i"}

    if state:
        query["state"] = {"$regex": f"^{state.strip()}$", "$options": "i"}

    if medicine_id:
        query["medicine_id"] = str(medicine_id)

    total = db["listings"].count_documents(query)
    offset = (page - 1) * limit
    cursor = db["listings"].find(query).sort("created_at", -1).skip(offset).limit(limit)
    listings = [Listing.from_doc(doc) for doc in cursor]

    return {
        "data": [listing_to_dict(l, db) for l in listings],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.get("/{listing_id}", summary="Get listing detail")
def get_listing(
    listing_id: str,
    db: Database = Depends(get_db),
    _: User = Depends(get_current_user),
):
    lid = str(listing_id)
    doc = db["listings"].find_one({"$or": [{"_id": lid}, {"id": lid}]})
    if not doc:
        raise ResourceNotFoundError("Listing")

    listing = Listing.from_doc(doc)
    return listing_to_dict(listing, db)


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
    db: Database = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    med_id_str = str(medicineId).strip()
    med_doc = db["medicines"].find_one({"$or": [{"_id": med_id_str}, {"id": med_id_str}, {"name": {"$regex": f"^{re.escape(med_id_str)}$", "$options": "i"}}]})
    if not med_doc:
        med_doc = {
            "_id": str(uuid.uuid4()),
            "id": str(uuid.uuid4()),
            "name": med_id_str,
            "generic_name": med_id_str,
            "category": "General",
            "dosage_form": "Tablet",
            "strength": "Standard",
            "manufacturer": "Unspecified",
            "is_restricted": False,
            "is_active": True,
        }
        db["medicines"].insert_one(med_doc)

    med_id = str(med_doc.get("id") or med_doc.get("_id"))

    try:
        expiry = date.fromisoformat(expiryDate)
    except ValueError:
        raise BusinessRuleError("Invalid expiry date format. Use YYYY-MM-DD")

    if expiry <= datetime.now(timezone.utc).date():
        raise BusinessRuleError("Expiry date must be in the future")

    try:
        condition = PackagingCondition(packagingCondition)
    except ValueError:
        raise BusinessRuleError(f"Invalid packaging condition: {packagingCondition}")

    if condition == PackagingCondition.DAMAGED:
        raise BusinessRuleError("Damaged medicine packaging is not eligible for donation")

    checklist = {}
    if safetyChecklist:
        try:
            checklist = json.loads(safetyChecklist)
        except json.JSONDecodeError:
            pass

    urgency = compute_urgency(expiry)
    eligible = (
        condition == PackagingCondition.SEALED_INTACT
        and storageConfirmed
        and urgency not in (UrgencyLevel.EXPIRED,)
    )

    listing_id = str(uuid.uuid4())
    image_url = None
    if image and image.filename:
        image_url = save_upload(image, listing_id)

    donor_doc = {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "donor_type": current_user.donor_type or "HOUSEHOLD",
    }

    listing = Listing(
        id=listing_id,
        _id=listing_id,
        donor_id=str(current_user.id),
        medicine_id=med_id,
        batch_number=batchNumber,
        expiry_date=expiry.isoformat(),
        quantity=quantity,
        quantity_available=quantity,
        packaging_condition=condition.value,
        storage_confirmed=storageConfirmed,
        safety_checklist_answers=checklist,
        eligibility_passed=eligible,
        image_url=image_url,
        city=city,
        state=state,
        postal_code=postalCode,
        latitude=latitude,
        longitude=longitude,
        urgency=urgency.value,
        status=ListingStatus.ACTIVE.value,
        medicine=med_doc,
        donor=donor_doc,
    )

    db["listings"].insert_one(listing.to_doc())

    audit_repository.log(
        db,
        event=AuditEvent.LISTING_CREATED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="Listing",
        resource_id=listing_id,
    )

    return listing_to_dict(listing, db)


@router.patch("/{listing_id}", summary="Update listing (donor)")
def update_listing(
    listing_id: str,
    payload: dict,
    db: Database = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    lid = str(listing_id)
    doc = db["listings"].find_one({"$or": [{"_id": lid}, {"id": lid}]})
    if not doc:
        raise ResourceNotFoundError("Listing")

    listing = Listing.from_doc(doc)
    if str(listing.donor_id) != str(current_user.id):
        raise AuthorizationError("You can only edit your own listings")

    update_fields = {}
    for key, value in payload.items():
        if key in ("city", "state", "postal_code", "postalCode", "quantity", "quantityAvailable"):
            update_fields[key] = value

    if update_fields:
        db["listings"].update_one({"$or": [{"_id": lid}, {"id": lid}]}, {"$set": update_fields})
        doc.update(update_fields)

    audit_repository.log(
        db,
        event=AuditEvent.LISTING_UPDATED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="Listing",
        resource_id=lid,
    )

    return listing_to_dict(Listing.from_doc(doc), db)


@router.post("/{listing_id}/image", summary="Upload or update listing image (donor)")
def upload_listing_image(
    listing_id: str,
    image: UploadFile = File(...),
    db: Database = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    lid = str(listing_id)
    doc = db["listings"].find_one({"$or": [{"_id": lid}, {"id": lid}]})
    if not doc:
        raise ResourceNotFoundError("Listing")

    if str(doc.get("donor_id")) != str(current_user.id):
        raise AuthorizationError("You can only edit your own listings")

    image_url = save_upload(image, lid)
    db["listings"].update_one(
        {"$or": [{"_id": lid}, {"id": lid}]},
        {"$set": {"image_url": image_url, "imageUrl": image_url}}
    )
    doc["image_url"] = image_url
    doc["imageUrl"] = image_url

    return listing_to_dict(Listing.from_doc(doc), db)


@router.delete("/{listing_id}", summary="Delete listing permanently (donor)")
def delete_listing(
    listing_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(require_donor),
):
    lid = str(listing_id)
    doc = db["listings"].find_one({"$or": [{"_id": lid}, {"id": lid}]})
    if not doc:
        raise ResourceNotFoundError("Listing")

    if str(doc.get("donor_id")) != str(current_user.id):
        raise AuthorizationError("You can only remove your own listings")

    db["notifications"].delete_many({"listing_id": lid})
    db["claims"].delete_many({"listing_id": lid})
    db["reports"].delete_many({"target_id": lid})
    db["listings"].delete_one({"$or": [{"_id": lid}, {"id": lid}]})

    audit_repository.log(
        db,
        event=AuditEvent.LISTING_DELETED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="Listing",
        resource_id=lid,
    )

    return {"message": "Listing deleted permanently"}


@router.post("/{listing_id}/report", summary="Report a listing")
def report_listing(
    listing_id: str,
    payload: dict,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lid = str(listing_id)
    doc = db["listings"].find_one({"$or": [{"_id": lid}, {"id": lid}]})
    if not doc:
        raise ResourceNotFoundError("Listing")

    reason_str = payload.get("reason", "OTHER")
    report = Report(
        reporter_id=str(current_user.id),
        target_type="listing",
        target_id=lid,
        reason=reason_str,
        description=payload.get("description"),
    )
    db["reports"].insert_one(report.to_doc())

    audit_repository.log(
        db,
        event=AuditEvent.REPORT_CREATED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="Listing",
        resource_id=lid,
    )

    return {"message": "Report submitted successfully"}
