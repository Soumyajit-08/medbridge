"""
app/routers/verification.py
──────────────────────────────────────────────────────────────────────────────
Recipient verification endpoints.

GET  /recipients/verification   → Get my verification status
POST /recipients/verification   → Submit verification documents
"""

import uuid
import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload

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


def submission_to_dict(sub: VerificationSubmission) -> dict:
    recipient = getattr(sub, 'recipient', None)
    result = {
        "id": str(sub.id),
        "recipientId": str(sub.recipient_id),
        "organizationName": (recipient.organization_name or recipient.name) if recipient else "",
        "organizationType": (recipient.organization_type.value if recipient and recipient.organization_type else "NGO"),
        "registrationNumber": sub.registration_number,
        "documentUrl": sub.document_url,
        "documentName": sub.document_name,
        "status": sub.status.value,
        "rejectionReason": sub.rejection_reason,
        "submittedAt": sub.submitted_at.isoformat(),
        "reviewedAt": sub.reviewed_at.isoformat() if sub.reviewed_at else None,
    }
    if hasattr(sub, 'reviewed_by') and sub.reviewed_by:
        result["reviewedBy"] = {
            "id": str(sub.reviewed_by.id),
            "name": sub.reviewed_by.name,
        }
    return result


@router.get("/verification", summary="Get my verification status")
def get_verification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/v1/recipients/verification

    Returns the recipient's verification submission if one exists.
    Returns null if no submission found.
    """
    if current_user.role != UserRole.RECIPIENT:
        raise AuthorizationError("Only recipients can access verification")

    sub = db.query(VerificationSubmission).options(
        joinedload(VerificationSubmission.reviewed_by)
    ).filter(
        VerificationSubmission.recipient_id == current_user.id
    ).first()

    if not sub:
        return None

    return submission_to_dict(sub)


@router.post("/verification", summary="Submit verification documents")
def submit_verification(
    registrationNumber: str = Form(...),
    document: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST /api/v1/recipients/verification

    Recipients submit their organization registration details
    and an optional supporting document (PDF or image).
    """
    if current_user.role != UserRole.RECIPIENT:
        raise AuthorizationError("Only recipients can submit verification")

    # Check for existing submission
    existing = db.query(VerificationSubmission).filter(
        VerificationSubmission.recipient_id == current_user.id
    ).first()

    if existing and existing.status == VerificationStatus.APPROVED:
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
        # Resubmission: update existing
        existing.registration_number = registrationNumber
        if document_url:
            existing.document_url = document_url
            existing.document_name = document_name
        existing.status = VerificationStatus.PENDING
        existing.rejection_reason = None
        existing.reviewed_at = None
        existing.reviewed_by_id = None
        sub = existing
    else:
        sub = VerificationSubmission(
            recipient_id=current_user.id,
            registration_number=registrationNumber,
            document_url=document_url,
            document_name=document_name,
            status=VerificationStatus.PENDING,
        )
        db.add(sub)

    db.flush()

    audit_repository.log(
        db, event=AuditEvent.VERIFICATION_SUBMITTED,
        user_id=current_user.id, user_name=current_user.name,
        resource_type="VerificationSubmission", resource_id=str(sub.id),
    )

    db.commit()
    db.refresh(sub)
    return submission_to_dict(sub)
