"""
app/routers/verification.py
──────────────────────────────────────────────────────────────────────────────
Recipient verification endpoints for MongoDB.
"""

import uuid
import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form
from pymongo.database import Database

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.verification_submission import VerificationSubmission
from app.models.user import User
from app.utils.enums import VerificationStatus, UserRole, AuditEvent
from app.utils.exceptions import AuthorizationError, BusinessRuleError
from app.repositories.audit_repository import audit_repository

router = APIRouter(prefix="/recipients", tags=["Verification"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads/verification"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def submission_to_dict(sub: VerificationSubmission, db: Optional[Database] = None) -> dict:
    recipient = sub.user or {}
    if not recipient and db is not None and sub.user_id:
        doc = db["users"].find_one({"$or": [{"_id": str(sub.user_id)}, {"id": str(sub.user_id)}]})
        if doc:
            recipient = doc

    org_name = sub.organization_name or recipient.get("organization_name") or recipient.get("name", "")
    org_type = sub.organization_type or recipient.get("organization_type", "NGO")
    status_val = sub.status if isinstance(sub.status, str) else getattr(sub.status, "value", str(sub.status))
    submitted_at_val = sub.created_at.isoformat() if hasattr(sub.created_at, "isoformat") else str(sub.created_at or "")
    reviewed_at_val = sub.reviewed_at.isoformat() if hasattr(sub.reviewed_at, "isoformat") and sub.reviewed_at else (str(sub.reviewed_at) if sub.reviewed_at else None)

    return {
        "id": str(sub.id),
        "recipientId": str(sub.user_id),
        "organizationName": org_name,
        "organizationType": org_type,
        "registrationNumber": sub.registration_number or "",
        "documentUrl": (sub.documents[0] if sub.documents else None) or sub.document_url,
        "documentName": sub.document_name,
        "status": status_val,
        "rejectionReason": sub.rejection_reason,
        "submittedAt": submitted_at_val,
        "reviewedAt": reviewed_at_val,
    }


@router.get("/verification", summary="Get my verification status")
def get_verification(
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "RECIPIENT":
        raise AuthorizationError("Only recipients can access verification")

    doc = db["verifications"].find_one({"$or": [{"user_id": str(current_user.id)}, {"recipient_id": str(current_user.id)}]})
    if not doc:
        return None

    sub = VerificationSubmission.from_doc(doc)
    return submission_to_dict(sub, db)


@router.post("/verification", summary="Submit verification documents")
def submit_verification(
    registrationNumber: str = Form(...),
    document: Optional[UploadFile] = File(None),
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "RECIPIENT":
        raise AuthorizationError("Only recipients can submit verification")

    existing = db["verifications"].find_one({"$or": [{"user_id": str(current_user.id)}, {"recipient_id": str(current_user.id)}]})
    if existing and existing.get("status") == "APPROVED":
        raise BusinessRuleError("Your verification is already approved")

    document_url = None
    document_name = None

    if document and document.filename:
        ext = Path(document.filename).suffix.lower()
        filename = f"{str(current_user.id)}{ext}"
        file_path = UPLOAD_DIR / filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(document.file, f)
        document_url = f"/uploads/verification/{filename}"
        document_name = document.filename

    if existing:
        update_fields = {
            "registration_number": registrationNumber,
            "status": "PENDING",
            "rejection_reason": None,
            "reviewed_at": None,
            "reviewed_by_id": None,
        }
        if document_url:
            update_fields["document_url"] = document_url
            update_fields["document_name"] = document_name
            update_fields["documents"] = [document_url]

        db["verifications"].update_one({"_id": existing["_id"]}, {"$set": update_fields})
        existing.update(update_fields)
        sub = VerificationSubmission.from_doc(existing)
    else:
        sub_id = str(uuid.uuid4())
        sub = VerificationSubmission(
            id=sub_id,
            _id=sub_id,
            user_id=str(current_user.id),
            organization_name=current_user.organization_name or current_user.name,
            organization_type=current_user.organization_type or "NGO",
            registration_number=registrationNumber,
            document_url=document_url,
            document_name=document_name,
            documents=[document_url] if document_url else [],
            status="PENDING",
        )
        db["verifications"].insert_one(sub.to_doc())

    # Update user status to PENDING
    db["users"].update_one(
        {"$or": [{"_id": str(current_user.id)}, {"id": str(current_user.id)}]},
        {"$set": {"verification_status": "PENDING"}}
    )

    audit_repository.log(
        db,
        event=AuditEvent.VERIFICATION_SUBMITTED,
        user_id=str(current_user.id),
        user_name=current_user.name,
        resource_type="VerificationSubmission",
        resource_id=str(sub.id),
    )

    return submission_to_dict(sub, db)
