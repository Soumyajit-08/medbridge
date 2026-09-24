"""
app/routers/needs.py
──────────────────────────────────────────────────────────────────────────────
Needs endpoints for MongoDB.
"""

import uuid
import re
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.need import Need
from app.models.medicine import Medicine
from app.models.user import User
from app.utils.enums import NeedStatus, UrgencyLevel, UserRole, VerificationStatus, AuditEvent
from app.utils.exceptions import ResourceNotFoundError, AuthorizationError, BusinessRuleError
from app.repositories.audit_repository import audit_repository

router = APIRouter(prefix="/needs", tags=["Needs"])


def need_to_dict(need: Need, db: Optional[Database] = None) -> dict:
    medicine = need.medicine or {}
    recipient = need.recipient or {}

    if (not medicine or not recipient) and db is not None:
        if not medicine and need.medicine_id:
            doc = db["medicines"].find_one({"$or": [{"_id": str(need.medicine_id)}, {"id": str(need.medicine_id)}]})
            if doc:
                medicine = doc
        if not recipient and need.recipient_id:
            doc = db["users"].find_one({"$or": [{"_id": str(need.recipient_id)}, {"id": str(need.recipient_id)}]})
            if doc:
                recipient = doc

    status_val = need.status if isinstance(need.status, str) else getattr(need.status, "value", str(need.status))
    urgency_val = need.urgency if isinstance(need.urgency, str) else getattr(need.urgency, "value", str(need.urgency))

    created_at_val = need.created_at.isoformat() if hasattr(need.created_at, "isoformat") else str(need.created_at or "")
    updated_at_val = need.updated_at.isoformat() if hasattr(need.updated_at, "isoformat") else str(need.updated_at or "")
    expires_at_val = need.expires_at.isoformat() if hasattr(need.expires_at, "isoformat") and need.expires_at else (str(need.expires_at) if need.expires_at else None)

    result = {
        "id": str(need.id),
        "recipientId": str(need.recipient_id),
        "medicineId": str(need.medicine_id or ""),
        "quantityNeeded": need.quantity_needed or need.quantity or 1,
        "urgency": urgency_val,
        "city": need.city or "",
        "state": need.state or "",
        "location": {
            "city": need.city or "",
            "state": need.state or "",
        },
        "description": need.description or need.reason or "",
        "matchCount": need.match_count or 0,
        "status": status_val,
        "expiresAt": expires_at_val,
        "createdAt": created_at_val,
        "updatedAt": updated_at_val,
    }

    if medicine:
        result["medicine"] = {
            "id": str(medicine.get("_id") or medicine.get("id", "")),
            "name": medicine.get("name", need.medicine_name or "Medicine"),
            "genericName": medicine.get("generic_name", need.generic_name or ""),
            "strength": medicine.get("strength", ""),
            "category": medicine.get("category", need.category or "General"),
        }
    elif need.medicine_name:
        result["medicine"] = {
            "id": str(need.medicine_id or ""),
            "name": need.medicine_name,
            "genericName": need.generic_name or "",
            "strength": "",
            "category": need.category or "General",
        }

    if recipient:
        result["recipient"] = {
            "id": str(recipient.get("_id") or recipient.get("id")),
            "name": recipient.get("name", ""),
            "organizationName": recipient.get("organization_name", ""),
        }

    return result


@router.get("", summary="Get needs")
def get_needs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = {}
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value

    if role_val == "RECIPIENT":
        query["recipient_id"] = str(current_user.id)
    elif role_val == "DONOR":
        query["status"] = {"$in": ["ACTIVE", "OPEN"]}

    if status:
        query["status"] = status

    total = db["needs"].count_documents(query)
    offset = (page - 1) * limit
    cursor = db["needs"].find(query).sort("created_at", -1).skip(offset).limit(limit)
    needs = [Need.from_doc(doc) for doc in cursor]

    return {
        "data": [need_to_dict(n, db) for n in needs],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.get("/{need_id}", summary="Get need detail")
def get_need(
    need_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    nid = str(need_id)
    doc = db["needs"].find_one({"$or": [{"_id": nid}, {"id": nid}]})
    if not doc:
        raise ResourceNotFoundError("Need")

    need = Need.from_doc(doc)
    return need_to_dict(need, db)


@router.post("", summary="Create need (recipient)")
def create_need(
    payload: dict,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "RECIPIENT":
        raise AuthorizationError("Only recipients can post needs")

    medicine_id_str = payload.get("medicineId") or payload.get("medicine_id")
    medicine_name = payload.get("medicineName") or payload.get("medicine_name") or ""
    quantity = int(payload.get("quantityNeeded") or payload.get("quantity_needed") or 1)
    urgency_str = payload.get("urgency", "MEDIUM")

    med_doc = None
    if medicine_id_str:
        med_doc = db["medicines"].find_one({"$or": [{"_id": str(medicine_id_str)}, {"id": str(medicine_id_str)}]})
    elif medicine_name:
        med_doc = db["medicines"].find_one({"name": {"$regex": f"^{re.escape(medicine_name.strip())}$", "$options": "i"}})

    if med_doc:
        med_id = str(med_doc.get("id") or med_doc.get("_id"))
        medicine_name = med_doc.get("name", medicine_name)
    else:
        med_id = str(uuid.uuid4())

    need_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=30)

    recipient_doc = {
        "id": str(current_user.id),
        "name": current_user.name,
        "organization_name": current_user.organization_name,
    }

    need = Need(
        id=need_id,
        _id=need_id,
        recipient_id=str(current_user.id),
        medicine_id=med_id,
        medicine_name=medicine_name,
        generic_name=payload.get("genericName") or (med_doc.get("generic_name") if med_doc else None),
        category=payload.get("category") or (med_doc.get("category") if med_doc else "General"),
        quantity_needed=quantity,
        urgency=urgency_str,
        description=payload.get("description") or payload.get("reason"),
        city=payload.get("city", ""),
        state=payload.get("state", ""),
        status="ACTIVE",
        expires_at=expires_at,
        medicine=med_doc,
        recipient=recipient_doc,
    )

    db["needs"].insert_one(need.to_doc())

    audit_repository.log(
        db,
        event=AuditEvent.NEED_CREATED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="Need",
        resource_id=need_id,
    )

    return need_to_dict(need, db)


@router.delete("/{need_id}", summary="Cancel need (recipient)")
def delete_need(
    need_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    nid = str(need_id)
    doc = db["needs"].find_one({"$or": [{"_id": nid}, {"id": nid}]})
    if not doc:
        raise ResourceNotFoundError("Need")

    if str(doc.get("recipient_id")) != str(current_user.id):
        raise AuthorizationError("Not your need")

    db["needs"].delete_one({"$or": [{"_id": nid}, {"id": nid}]})
    return {"message": "Need cancelled successfully"}
