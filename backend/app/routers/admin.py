"""
app/routers/admin.py
──────────────────────────────────────────────────────────────────────────────
Admin-only endpoints.

GET   /admin/dashboard                    → Overall platform stats
GET   /admin/verifications               → Pending verification submissions
GET   /admin/verifications/{id}          → Single verification detail
PATCH /admin/recipients/{id}/approve     → Approve a recipient
PATCH /admin/recipients/{id}/reject      → Reject a recipient
GET   /admin/reports                     → All reports
PATCH /admin/reports/{id}/resolve        → Resolve a report
GET   /admin/audit-logs                  → Paginated audit log
GET   /admin/users                       → All users
GET   /admin/listings                    → All listings (admin view)
GET   /admin/analytics                   → Impact analytics
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.db.session import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.listing import Listing
from app.models.claim import Claim
from app.models.need import Need
from app.models.verification_submission import VerificationSubmission
from app.models.report import Report
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.utils.enums import (
    VerificationStatus, ReportStatus, UserRole,
    ListingStatus, ClaimStatus, AuditEvent, NotificationType,
)
from app.utils.exceptions import ResourceNotFoundError, BusinessRuleError
from app.repositories.audit_repository import audit_repository

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── GET /admin/dashboard ──────────────────────────────────────────────────────
@router.get("/dashboard", summary="Admin dashboard stats")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_donors = db.query(func.count(User.id)).filter(
        User.is_active == True, User.role == UserRole.DONOR
    ).scalar() or 0
    total_recipients = db.query(func.count(User.id)).filter(
        User.is_active == True, User.role == UserRole.RECIPIENT
    ).scalar() or 0
    pending_verifications = db.query(func.count(VerificationSubmission.id)).filter(
        VerificationSubmission.status == VerificationStatus.PENDING
    ).scalar() or 0

    total_listings = db.query(func.count(Listing.id)).scalar() or 0
    active_listings = db.query(func.count(Listing.id)).filter(
        Listing.status == ListingStatus.ACTIVE
    ).scalar() or 0
    completed_listings = db.query(func.count(Listing.id)).filter(
        Listing.status == ListingStatus.COMPLETED
    ).scalar() or 0
    expired_listings = db.query(func.count(Listing.id)).filter(
        Listing.status == ListingStatus.EXPIRED
    ).scalar() or 0

    total_claims = db.query(func.count(Claim.id)).scalar() or 0
    completed_claims = db.query(func.count(Claim.id)).filter(
        Claim.status == ClaimStatus.COMPLETED
    ).scalar() or 0

    total_units_donated = db.query(
        func.coalesce(func.sum(Claim.requested_quantity), 0)
    ).filter(Claim.status == ClaimStatus.COMPLETED).scalar() or 0

    open_reports = db.query(func.count(Report.id)).filter(
        Report.status.in_([ReportStatus.PENDING, ReportStatus.OPEN])
    ).scalar() or 0

    return {
        "users": {
            "total": total_users,
            "donors": total_donors,
            "recipients": total_recipients,
            "pendingVerifications": pending_verifications,
        },
        "listings": {
            "total": total_listings,
            "active": active_listings,
            "completed": completed_listings,
            "expired": expired_listings,
        },
        "claims": {
            "total": total_claims,
            "completed": completed_claims,
        },
        "impact": {
            "totalUnitsDonated": int(total_units_donated),
        },
        "reports": {
            "open": open_reports,
        },
    }


# ── GET /admin/verifications ──────────────────────────────────────────────────
@router.get("/verifications", summary="List verification submissions")
def get_verifications(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(VerificationSubmission).options(
        joinedload(VerificationSubmission.recipient),
        joinedload(VerificationSubmission.reviewed_by),
    )

    if status:
        try:
            query = query.filter(VerificationSubmission.status == VerificationStatus(status))
        except ValueError:
            pass
    else:
        # Default: show pending first
        query = query.filter(VerificationSubmission.status == VerificationStatus.PENDING)

    total = query.count()
    offset = (page - 1) * limit
    subs = query.order_by(VerificationSubmission.submitted_at.desc()).offset(offset).limit(limit).all()

    def sub_to_dict(s):
        return {
            "id": str(s.id),
            "recipientId": str(s.recipient_id),
            "organizationName": (s.recipient.organization_name or s.recipient.name) if s.recipient else "",
            "organizationType": (s.recipient.organization_type.value if s.recipient and s.recipient.organization_type else "NGO"),
            "recipient": {
                "id": str(s.recipient.id),
                "name": s.recipient.name,
                "email": s.recipient.email,
                "organizationName": s.recipient.organization_name,
                "organizationType": s.recipient.organization_type.value if s.recipient.organization_type else None,
            } if s.recipient else None,
            "registrationNumber": s.registration_number,
            "documentUrl": s.document_url,
            "documentName": s.document_name,
            "status": s.status.value,
            "rejectionReason": s.rejection_reason,
            "submittedAt": s.submitted_at.isoformat(),
            "reviewedAt": s.reviewed_at.isoformat() if s.reviewed_at else None,
        }

    return [sub_to_dict(s) for s in subs]


# ── GET /admin/verifications/{id} ─────────────────────────────────────────────
@router.get("/verifications/{submission_id}", summary="Get verification detail")
def get_verification(
    submission_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        sid = uuid.UUID(submission_id)
    except ValueError:
        raise ResourceNotFoundError("VerificationSubmission")

    sub = db.query(VerificationSubmission).options(
        joinedload(VerificationSubmission.recipient),
        joinedload(VerificationSubmission.reviewed_by),
    ).filter(VerificationSubmission.id == sid).first()

    if not sub:
        raise ResourceNotFoundError("VerificationSubmission")

    return {
        "id": str(sub.id),
        "recipientId": str(sub.recipient_id),
        "organizationName": (sub.recipient.organization_name or sub.recipient.name) if sub.recipient else "",
        "organizationType": (sub.recipient.organization_type.value if sub.recipient and sub.recipient.organization_type else "NGO"),
        "recipient": {
            "id": str(sub.recipient.id),
            "name": sub.recipient.name,
            "email": sub.recipient.email,
            "phone": sub.recipient.phone,
            "organizationName": sub.recipient.organization_name,
            "organizationType": sub.recipient.organization_type.value if sub.recipient.organization_type else None,
            "verificationStatus": sub.recipient.verification_status.value if sub.recipient.verification_status else None,
        } if sub.recipient else None,
        "registrationNumber": sub.registration_number,
        "documentUrl": sub.document_url,
        "documentName": sub.document_name,
        "status": sub.status.value,
        "rejectionReason": sub.rejection_reason,
        "submittedAt": sub.submitted_at.isoformat(),
        "reviewedAt": sub.reviewed_at.isoformat() if sub.reviewed_at else None,
    }


def _review_recipient(db, recipient_id: str, status: VerificationStatus,
                      admin: User, rejection_reason: Optional[str] = None):
    """Shared logic for approve/reject."""
    try:
        rid = uuid.UUID(recipient_id)
    except ValueError:
        raise ResourceNotFoundError("User")

    recipient = db.query(User).filter(
        User.id == rid, User.role == UserRole.RECIPIENT, User.is_active == True
    ).first()
    if not recipient:
        raise ResourceNotFoundError("Recipient")

    # Update user verification_status
    recipient.verification_status = status
    db.flush()

    # Update submission record
    sub = db.query(VerificationSubmission).filter(
        VerificationSubmission.recipient_id == rid
    ).first()
    if sub:
        sub.status = status
        sub.reviewed_by_id = admin.id
        sub.reviewed_at = datetime.now(timezone.utc)
        sub.rejection_reason = rejection_reason
        db.flush()

    # Notify recipient
    n = Notification(
        user_id=recipient.id,
        type=NotificationType.VERIFICATION_APPROVED if status == VerificationStatus.APPROVED
             else NotificationType.VERIFICATION_REJECTED,
        title="Verification " + ("Approved" if status == VerificationStatus.APPROVED else "Rejected"),
        message=(
            "Congratulations! Your verification has been approved. You can now claim medicines."
            if status == VerificationStatus.APPROVED
            else f"Your verification was rejected. Reason: {rejection_reason or 'No reason provided'}. Please resubmit."
        ),
        link="/recipient/verification",
    )
    db.add(n)

    audit_event = (
        AuditEvent.VERIFICATION_APPROVED
        if status == VerificationStatus.APPROVED
        else AuditEvent.VERIFICATION_REJECTED
    )
    audit_repository.log(
        db, event=audit_event,
        user_id=admin.id, user_name=admin.name,
        resource_type="User", resource_id=str(recipient.id),
        detail=rejection_reason,
    )


# ── PATCH /admin/recipients/{id}/approve ─────────────────────────────────────
@router.patch("/recipients/{recipient_id}/approve", summary="Approve recipient")
def approve_recipient(
    recipient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _review_recipient(db, recipient_id, VerificationStatus.APPROVED, current_user)
    db.commit()
    return {"message": "Recipient approved successfully"}


# ── PATCH /admin/recipients/{id}/reject ──────────────────────────────────────
@router.patch("/recipients/{recipient_id}/reject", summary="Reject recipient")
def reject_recipient(
    recipient_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reason = payload.get("reason", "Documents insufficient")
    _review_recipient(db, recipient_id, VerificationStatus.REJECTED, current_user, reason)
    db.commit()
    return {"message": "Recipient rejected"}


# ── GET /admin/reports ────────────────────────────────────────────────────────
@router.get("/reports", summary="List reports")
def get_reports(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Report).options(
        joinedload(Report.reporter),
        joinedload(Report.listing),
        joinedload(Report.resolved_by),
    )

    if status:
        try:
            query = query.filter(Report.status == ReportStatus(status))
        except ValueError:
            pass

    total = query.count()
    offset = (page - 1) * limit
    reports = query.order_by(Report.created_at.desc()).offset(offset).limit(limit).all()

    def report_to_dict(r):
        return {
            "id": str(r.id),
            "reporterId": str(r.reporter_id),
            "reporter": {"id": str(r.reporter.id), "name": r.reporter.name} if r.reporter else None,
            "listingId": str(r.listing_id),
            "listing": {"id": str(r.listing.id)} if r.listing else None,
            "reason": r.reason.value,
            "description": r.description,
            "status": r.status.value,
            "resolutionNote": r.resolution_note,
            "createdAt": r.created_at.isoformat(),
            "resolvedAt": r.resolved_at.isoformat() if r.resolved_at else None,
        }

    return [report_to_dict(r) for r in reports]


# ── PATCH /admin/reports/{id}/resolve ────────────────────────────────────────
@router.patch("/reports/{report_id}/resolve", summary="Resolve report")
def resolve_report(
    report_id: str,
    payload: dict = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if payload is None:
        payload = {}

    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise ResourceNotFoundError("Report")

    report = db.query(Report).filter(Report.id == rid).first()
    if not report:
        raise ResourceNotFoundError("Report")

    report.status = ReportStatus.RESOLVED
    report.resolved_by_id = current_user.id
    report.resolved_at = datetime.now(timezone.utc)
    report.resolution_note = payload.get("note")
    db.flush()

    audit_repository.log(
        db, event=AuditEvent.REPORT_RESOLVED,
        user_id=current_user.id, user_name=current_user.name,
        resource_type="Report", resource_id=str(report.id),
    )

    db.commit()
    return {"message": "Report resolved"}


# ── GET /admin/audit-logs ─────────────────────────────────────────────────────
@router.get("/audit-logs", summary="Get audit logs")
def get_audit_logs(
    event: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(AuditLog)

    if event:
        query = query.filter(AuditLog.event == event)

    total = query.count()
    offset = (page - 1) * limit
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "data": [
            {
                "id": str(l.id),
                "event": l.event,
                "userId": str(l.user_id) if l.user_id else None,
                "userName": l.user_name,
                "resourceType": l.resource_type,
                "resourceId": l.resource_id,
                "detail": l.detail,
                "ipAddress": l.ip_address,
                "createdAt": l.created_at.isoformat(),
            }
            for l in logs
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit,
    }


# ── GET /admin/users ──────────────────────────────────────────────────────────
@router.get("/users", summary="List all users")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(User).filter(User.is_active == True)

    if role:
        try:
            query = query.filter(User.role == UserRole(role))
        except ValueError:
            pass

    total = query.count()
    offset = (page - 1) * limit
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role.value,
            "donorType": u.donor_type.value if u.donor_type else None,
            "organizationName": u.organization_name,
            "organizationType": u.organization_type.value if u.organization_type else None,
            "verificationStatus": u.verification_status.value if u.verification_status else None,
            "isActive": u.is_active,
            "createdAt": u.created_at.isoformat(),
        }
        for u in users
    ]


# ── GET /admin/listings ───────────────────────────────────────────────────────
@router.get("/listings", summary="Admin: list all listings")
def get_all_listings(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    from app.routers.listings import listing_to_dict
    query = db.query(Listing).options(
        joinedload(Listing.medicine),
        joinedload(Listing.donor),
    )

    if status:
        try:
            query = query.filter(Listing.status == ListingStatus(status))
        except ValueError:
            pass

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


# ── GET /admin/analytics ──────────────────────────────────────────────────────
@router.get("/analytics", summary="Impact analytics")
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    GET /api/v1/admin/analytics

    Returns high-level impact metrics for the platform analytics page.
    """
    total_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_listings = db.query(func.count(Listing.id)).scalar() or 0
    total_claims = db.query(func.count(Claim.id)).scalar() or 0
    completed_claims = db.query(func.count(Claim.id)).filter(
        Claim.status == ClaimStatus.COMPLETED
    ).scalar() or 0
    total_units_donated = db.query(
        func.coalesce(func.sum(Claim.requested_quantity), 0)
    ).filter(Claim.status == ClaimStatus.COMPLETED).scalar() or 0

    completion_rate = round((completed_claims / total_claims * 100) if total_claims > 0 else 0, 1)

    # By category
    from app.models.medicine import Medicine
    category_stats = (
        db.query(Medicine.category, func.count(Listing.id))
        .join(Listing, Listing.medicine_id == Medicine.id)
        .filter(Listing.status == ListingStatus.COMPLETED)
        .group_by(Medicine.category)
        .order_by(func.count(Listing.id).desc())
        .limit(10)
        .all()
    )

    return {
        "totalUsers": total_users,
        "totalListings": total_listings,
        "totalClaims": total_claims,
        "completedDonations": completed_claims,
        "totalUnitsDonated": int(total_units_donated),
        "completionRate": completion_rate,
        "topCategories": [
            {"category": cat, "count": count}
            for cat, count in category_stats
        ],
    }
