"""
app/routers/needs.py
──────────────────────────────────────────────────────────────────────────────
Needs endpoints — verified recipients declare medicine needs.

GET    /needs              → Get my needs (recipient) or all needs (admin)
GET    /needs/{id}         → Get need detail
POST   /needs              → Recipient creates a need
PATCH  /needs/{id}         → Recipient updates a need
DELETE /needs/{id}         → Recipient cancels a need
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.need import Need
from app.models.medicine import Medicine
from app.models.user import User
from app.utils.enums import NeedStatus, UrgencyLevel, UserRole, VerificationStatus, AuditEvent
from app.utils.exceptions import ResourceNotFoundError, AuthorizationError, BusinessRuleError
from app.repositories.audit_repository import audit_repository

router = APIRouter(prefix="/needs", tags=["Needs"])


def need_to_dict(need: Need) -> dict:
    result = {
        "id": str(need.id),
        "recipientId": str(need.recipient_id),
        "medicineId": str(need.medicine_id),
        "quantityNeeded": need.quantity_needed,
        "urgency": need.urgency.value,
        "city": need.city,
        "state": need.state,
        "location": {
            "city": need.city or "",
            "state": need.state or "",
        },
        "description": need.description,
        "matchCount": need.match_count,
        "status": need.status.value,
        "expiresAt": need.expires_at.isoformat(),
        "createdAt": need.created_at.isoformat(),
        "updatedAt": need.updated_at.isoformat(),
    }
    if hasattr(need, 'medicine') and need.medicine:
        result["medicine"] = {
            "id": str(need.medicine.id),
            "name": need.medicine.name,
            "genericName": need.medicine.generic_name,
            "strength": need.medicine.strength,
            "category": need.medicine.category,
        }
    if hasattr(need, 'recipient') and need.recipient:
        result["recipient"] = {
            "id": str(need.recipient.id),
            "name": need.recipient.name,
            "organizationName": need.recipient.organization_name,
        }
    return result


# ── GET /needs ────────────────────────────────────────────────────────────────
@router.get("", summary="Get needs")
def get_needs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Need).options(
        joinedload(Need.medicine),
        joinedload(Need.recipient),
    )

    if current_user.role == UserRole.RECIPIENT:
        query = query.filter(Need.recipient_id == current_user.id)
    elif current_user.role == UserRole.DONOR:
        # Donors see all ACTIVE needs (for matching context)
        query = query.filter(Need.status == NeedStatus.ACTIVE)
    # ADMIN: sees all

    if status:
        try:
            query = query.filter(Need.status == NeedStatus(status))
        except ValueError:
            pass

    total = query.count()
    offset = (page - 1) * limit
    needs = query.order_by(Need.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "data": [need_to_dict(n) for n in needs],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit,
    }


# ── GET /needs/{id} ───────────────────────────────────────────────────────────
@router.get("/{need_id}", summary="Get need detail")
def get_need(
    need_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        nid = uuid.UUID(need_id)
    except ValueError:
        raise ResourceNotFoundError("Need")

    need = db.query(Need).options(
        joinedload(Need.medicine),
        joinedload(Need.recipient),
    ).filter(Need.id == nid).first()

    if not need:
        raise ResourceNotFoundError("Need")

    # Access: recipient sees their own; admin/donor sees all
    if current_user.role == UserRole.RECIPIENT and str(need.recipient_id) != str(current_user.id):
        raise AuthorizationError("Not your need")

    return need_to_dict(need)


# ── POST /needs ───────────────────────────────────────────────────────────────
@router.post("", summary="Create need (recipient)")
def create_need(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.RECIPIENT:
        raise AuthorizationError("Only recipients can create needs")

    if current_user.verification_status != VerificationStatus.APPROVED:
        raise BusinessRuleError("Your account must be verified before creating needs")

    medicine_id_str = str(payload.get("medicineId", "")).strip()
    if not medicine_id_str:
        raise BusinessRuleError("Medicine is required")

    medicine = None
    try:
        mid = uuid.UUID(medicine_id_str)
        medicine = db.query(Medicine).filter(Medicine.id == mid, Medicine.is_active == True).first()
    except ValueError:
        mid = None

    if not medicine:
        medicine = db.query(Medicine).filter(
            func.lower(Medicine.name) == medicine_id_str.lower(),
            Medicine.is_active == True
        ).first()

    if not medicine:
        medicine = db.query(Medicine).filter(
            Medicine.name.ilike(f"%{medicine_id_str}%"),
            Medicine.is_active == True
        ).first()

    if not medicine:
        medicine = Medicine(
            name=medicine_id_str,
            generic_name=medicine_id_str,
            category="General",
            dosage_form="Tablet",
            strength="Standard",
            manufacturer="Unspecified",
        )
        db.add(medicine)
        db.flush()

    mid = medicine.id

    urgency_str = payload.get("urgency", "LOW")
    try:
        urgency = UrgencyLevel(urgency_str)
    except ValueError:
        urgency = UrgencyLevel.LOW

    # Set expiry (default 30 days from now)
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    need = Need(
        recipient_id=current_user.id,
        medicine_id=mid,
        quantity_needed=payload.get("quantityNeeded", 1),
        urgency=urgency,
        city=payload.get("city", ""),
        state=payload.get("state", ""),
        description=payload.get("description"),
        expires_at=expires_at,
        status=NeedStatus.ACTIVE,
    )
    db.add(need)
    db.flush()

    audit_repository.log(
        db, event=AuditEvent.NEED_CREATED,
        user_id=current_user.id, user_name=current_user.name,
        resource_type="Need", resource_id=str(need.id),
    )

    db.commit()

    need = db.query(Need).options(
        joinedload(Need.medicine),
        joinedload(Need.recipient),
    ).filter(Need.id == need.id).first()

    return need_to_dict(need)


# ── PATCH /needs/{id} ────────────────────────────────────────────────────────
@router.patch("/{need_id}", summary="Update need (recipient)")
def update_need(
    need_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        nid = uuid.UUID(need_id)
    except ValueError:
        raise ResourceNotFoundError("Need")

    need = db.query(Need).filter(Need.id == nid).first()
    if not need:
        raise ResourceNotFoundError("Need")

    if str(need.recipient_id) != str(current_user.id):
        raise AuthorizationError("Not your need")

    if need.status != NeedStatus.ACTIVE:
        raise BusinessRuleError("Can only update ACTIVE needs")

    if "quantityNeeded" in payload:
        need.quantity_needed = payload["quantityNeeded"]
    if "urgency" in payload:
        try:
            need.urgency = UrgencyLevel(payload["urgency"])
        except ValueError:
            pass
    if "description" in payload:
        need.description = payload["description"]
    if "city" in payload:
        need.city = payload["city"]
    if "state" in payload:
        need.state = payload["state"]

    db.flush()
    db.commit()

    need = db.query(Need).options(
        joinedload(Need.medicine),
        joinedload(Need.recipient),
    ).filter(Need.id == need.id).first()

    return need_to_dict(need)


# ── DELETE /needs/{id} ────────────────────────────────────────────────────────
@router.delete("/{need_id}", summary="Cancel need (recipient)")
def delete_need(
    need_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        nid = uuid.UUID(need_id)
    except ValueError:
        raise ResourceNotFoundError("Need")

    need = db.query(Need).filter(Need.id == nid).first()
    if not need:
        raise ResourceNotFoundError("Need")

    if str(need.recipient_id) != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise AuthorizationError("Not your need")

    need.status = NeedStatus.CANCELLED
    db.flush()

    audit_repository.log(
        db, event=AuditEvent.NEED_CANCELLED,
        user_id=current_user.id, user_name=current_user.name,
        resource_type="Need", resource_id=str(need.id),
    )

    db.commit()
    return {"message": "Need cancelled successfully"}
