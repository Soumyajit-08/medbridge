"""
app/routers/admin.py
──────────────────────────────────────────────────────────────────────────────
Admin-only endpoints for MongoDB.

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
from pymongo.database import Database

from app.db.session import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.listing import Listing
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
from app.routers.listings import listing_to_dict

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── GET /admin/dashboard ──────────────────────────────────────────────────────
@router.get("/dashboard", summary="Admin dashboard stats")
def admin_dashboard(
    db: Database = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total_users = db["users"].count_documents({"is_active": {"$ne": False}})
    total_donors = db["users"].count_documents({
        "is_active": {"$ne": False},
        "role": UserRole.DONOR.value
    })
    total_recipients = db["users"].count_documents({
        "is_active": {"$ne": False},
        "role": UserRole.RECIPIENT.value
    })
    pending_verifications = db["verification_submissions"].count_documents({
        "status": VerificationStatus.PENDING.value
    })

    total_listings = db["listings"].count_documents({})
    active_listings = db["listings"].count_documents({"status": ListingStatus.ACTIVE.value})
    completed_listings = db["listings"].count_documents({"status": ListingStatus.COMPLETED.value})
    expired_listings = db["listings"].count_documents({"status": ListingStatus.EXPIRED.value})

    total_claims = db["claims"].count_documents({})
    pending_claims = db["claims"].count_documents({"status": ClaimStatus.PENDING.value})
    completed_claims = db["claims"].count_documents({"status": ClaimStatus.COMPLETED.value})

    pipeline = [
        {"$match": {"status": ClaimStatus.COMPLETED.value}},
        {"$group": {"_id": None, "total": {"$sum": "$requested_quantity"}}}
    ]
    sum_res = list(db["claims"].aggregate(pipeline))
    total_units_donated = sum_res[0]["total"] if sum_res else 0

    open_reports = db["reports"].count_documents({
        "status": {"$in": [ReportStatus.PENDING.value, ReportStatus.OPEN.value]}
    })

    # Return flat keys that match frontend AdminDashboardStats interface
    # as well as nested keys for backwards compatibility
    return {
        "totalUsers": total_users,
        "pendingVerifications": pending_verifications,
        "activeListings": active_listings,
        "pendingClaims": pending_claims,
        "reports": open_reports,
        "completedTransfers": completed_claims,
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
            "pending": pending_claims,
            "completed": completed_claims,
        },
        "impact": {
            "totalUnitsDonated": int(total_units_donated),
        },
    }


# ── GET /admin/verifications ──────────────────────────────────────────────────
@router.get("/verifications", summary="List verification submissions")
def get_verifications(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    now = datetime.now(timezone.utc)

    # Sync any registered RECIPIENT users who are PENDING into verification_submissions
    pending_recipients = list(db["users"].find({
        "role": UserRole.RECIPIENT.value,
        "verification_status": VerificationStatus.PENDING.value,
        "is_active": {"$ne": False}
    }))
    for u in pending_recipients:
        uid = str(u.get("_id") or u.get("id"))
        existing_sub = db["verification_submissions"].find_one({
            "$or": [{"user_id": uid}, {"recipient_id": uid}, {"_id": uid}, {"id": uid}]
        })
        if not existing_sub:
            sub_id = str(uuid.uuid4())
            db["verification_submissions"].insert_one({
                "_id": sub_id,
                "id": sub_id,
                "user_id": uid,
                "recipient_id": uid,
                "organization_name": u.get("organization_name") or u.get("name") or "Recipient Organization",
                "organization_type": u.get("organization_type") or "NGO",
                "registration_number": "PENDING_SUBMISSION",
                "documents": [],
                "document_url": None,
                "document_name": "Awaiting Document Upload",
                "status": VerificationStatus.PENDING.value,
                "created_at": u.get("created_at") or now,
                "updated_at": now,
            })

    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = VerificationStatus.PENDING.value

    offset = (page - 1) * limit
    cursor = db["verification_submissions"].find(query).sort("created_at", -1).skip(offset).limit(limit)

    results = []
    for doc in cursor:
        sub = VerificationSubmission.from_doc(doc)
        rec_id = sub.user_id or sub.recipient_id
        user_doc = None
        if rec_id:
            user_doc = db["users"].find_one({"$or": [{"_id": str(rec_id)}, {"id": str(rec_id)}]})

        org_name = (user_doc.get("organization_name") if user_doc else None) or (user_doc.get("name") if user_doc else "") or sub.organization_name or "Recipient Organization"
        org_type = (user_doc.get("organization_type") if user_doc else None) or sub.organization_type or "NGO"
        if hasattr(org_type, "value"):
            org_type = org_type.value

        created_at_val = sub.created_at or sub.submitted_at or (user_doc.get("created_at") if user_doc else None) or now
        created_at_str = created_at_val.isoformat() if hasattr(created_at_val, "isoformat") else str(created_at_val or "")
        reviewed_at_str = sub.reviewed_at.isoformat() if hasattr(sub.reviewed_at, "isoformat") and sub.reviewed_at else (str(sub.reviewed_at) if sub.reviewed_at else None)

        doc_url = (sub.documents[0] if sub.documents else None) or sub.document_url

        results.append({
            "id": str(sub.id),
            "recipientId": str(rec_id),
            "organizationName": org_name,
            "organizationType": str(org_type),
            "recipient": {
                "id": str(user_doc["_id"]) if user_doc else str(rec_id),
                "name": user_doc.get("name", "") if user_doc else "",
                "email": user_doc.get("email", "") if user_doc else "",
                "organizationName": user_doc.get("organization_name", "") if user_doc else org_name,
                "organizationType": str(org_type),
            } if user_doc else None,
            "registrationNumber": sub.registration_number or "PENDING_SUBMISSION",
            "documentUrl": doc_url,
            "documentName": sub.document_name or (doc_url.split("/")[-1] if doc_url else "Awaiting Document Upload"),
            "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status),
            "rejectionReason": sub.rejection_reason,
            "submittedAt": created_at_str,
            "reviewedAt": reviewed_at_str,
        })

    return results


# ── GET /admin/verifications/{id} ─────────────────────────────────────────────
@router.get("/verifications/{submission_id}", summary="Get verification detail")
def get_verification(
    submission_id: str,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    doc = db["verification_submissions"].find_one({
        "$or": [
            {"_id": submission_id},
            {"id": submission_id},
            {"user_id": submission_id},
            {"recipient_id": submission_id}
        ]
    })
    
    user_doc = None
    if not doc:
        # Check if submission_id is a User ID
        user_doc = db["users"].find_one({
            "$or": [{"_id": submission_id}, {"id": submission_id}],
            "role": UserRole.RECIPIENT.value
        })
        if not user_doc:
            raise ResourceNotFoundError("VerificationSubmission")
        
        # Auto-create submission record
        now = datetime.now(timezone.utc)
        sub_id = str(uuid.uuid4())
        doc = {
            "_id": sub_id,
            "id": sub_id,
            "user_id": str(user_doc["_id"]),
            "recipient_id": str(user_doc["_id"]),
            "organization_name": user_doc.get("organization_name") or user_doc.get("name"),
            "organization_type": user_doc.get("organization_type") or "NGO",
            "registration_number": "PENDING_SUBMISSION",
            "documents": [],
            "document_url": None,
            "document_name": "Awaiting Document Upload",
            "status": user_doc.get("verification_status") or VerificationStatus.PENDING.value,
            "created_at": user_doc.get("created_at") or now,
            "updated_at": now,
        }
        db["verification_submissions"].insert_one(doc)

    sub = VerificationSubmission.from_doc(doc)
    rec_id = sub.user_id or sub.recipient_id
    if not user_doc and rec_id:
        user_doc = db["users"].find_one({"$or": [{"_id": str(rec_id)}, {"id": str(rec_id)}]})

    org_name = (user_doc.get("organization_name") if user_doc else None) or (user_doc.get("name") if user_doc else "") or sub.organization_name or ""
    org_type = (user_doc.get("organization_type") if user_doc else None) or sub.organization_type or "NGO"
    if hasattr(org_type, "value"):
        org_type = org_type.value

    created_at_val = sub.created_at or sub.submitted_at or (user_doc.get("created_at") if user_doc else None)
    created_at_str = created_at_val.isoformat() if hasattr(created_at_val, "isoformat") else str(created_at_val or "")
    reviewed_at_str = sub.reviewed_at.isoformat() if hasattr(sub.reviewed_at, "isoformat") and sub.reviewed_at else (str(sub.reviewed_at) if sub.reviewed_at else None)

    doc_url = (sub.documents[0] if sub.documents else None) or sub.document_url

    return {
        "id": str(sub.id),
        "recipientId": str(rec_id),
        "organizationName": org_name,
        "organizationType": str(org_type),
        "recipient": {
            "id": str(user_doc["_id"]) if user_doc else str(rec_id),
            "name": user_doc.get("name", "") if user_doc else "",
            "email": user_doc.get("email", "") if user_doc else "",
            "phone": user_doc.get("phone", "") if user_doc else "",
            "organizationName": user_doc.get("organization_name", "") if user_doc else org_name,
            "organizationType": str(org_type),
            "verificationStatus": user_doc.get("verification_status") if user_doc else None,
        } if user_doc else None,
        "registrationNumber": sub.registration_number or "PENDING_SUBMISSION",
        "documentUrl": doc_url,
        "documentName": sub.document_name or (doc_url.split("/")[-1] if doc_url else "Awaiting Document Upload"),
        "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status),
        "rejectionReason": sub.rejection_reason,
        "submittedAt": created_at_str,
        "reviewedAt": reviewed_at_str,
    }


def _review_recipient(db: Database, recipient_id: str, status: VerificationStatus,
                      admin: User, rejection_reason: Optional[str] = None):
    """Shared logic for approve/reject."""
    user_doc = db["users"].find_one({
        "$or": [{"_id": str(recipient_id)}, {"id": str(recipient_id)}],
        "role": UserRole.RECIPIENT.value,
        "is_active": {"$ne": False}
    })
    if not user_doc:
        raise ResourceNotFoundError("Recipient")

    now = datetime.now(timezone.utc)

    # Update user verification_status
    db["users"].update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"verification_status": status.value, "updated_at": now}}
    )

    # Update submission record
    sub_doc = db["verification_submissions"].find_one({
        "$or": [{"user_id": str(recipient_id)}, {"recipient_id": str(recipient_id)}]
    })
    if sub_doc:
        db["verification_submissions"].update_one(
            {"_id": sub_doc["_id"]},
            {
                "$set": {
                    "status": status.value,
                    "reviewed_by_id": str(admin.id),
                    "reviewed_at": now,
                    "rejection_reason": rejection_reason,
                    "updated_at": now,
                }
            }
        )
    else:
        # Create submission record if not existing
        sub_id = str(uuid.uuid4())
        db["verification_submissions"].insert_one({
            "_id": sub_id,
            "id": sub_id,
            "user_id": str(recipient_id),
            "recipient_id": str(recipient_id),
            "organization_name": user_doc.get("organization_name") or user_doc.get("name"),
            "organization_type": user_doc.get("organization_type") or "NGO",
            "registration_number": "ADMIN_APPROVED",
            "documents": [],
            "document_url": None,
            "document_name": "Direct Admin Review",
            "status": status.value,
            "reviewed_by_id": str(admin.id),
            "reviewed_at": now,
            "rejection_reason": rejection_reason,
            "created_at": user_doc.get("created_at") or now,
            "updated_at": now,
        })

    # Notify recipient
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=str(recipient_id),
        type=NotificationType.VERIFICATION_APPROVED if status == VerificationStatus.APPROVED
             else NotificationType.VERIFICATION_REJECTED,
        title="Verification " + ("Approved" if status == VerificationStatus.APPROVED else "Rejected"),
        message=(
            "Congratulations! Your verification has been approved. You can now claim medicines."
            if status == VerificationStatus.APPROVED
            else f"Your verification was rejected. Reason: {rejection_reason or 'No reason provided'}. Please resubmit."
        ),
        link="/recipient/verification",
        is_read=False,
        created_at=now,
    )
    db["notifications"].insert_one(notif.to_doc())

    audit_event = (
        AuditEvent.VERIFICATION_APPROVED
        if status == VerificationStatus.APPROVED
        else AuditEvent.VERIFICATION_REJECTED
    )
    audit_repository.log(
        db, event=audit_event,
        user_id=admin.id, user_name=admin.name,
        resource_type="User", resource_id=str(recipient_id),
        detail=rejection_reason,
    )


# ── PATCH /admin/recipients/{id}/approve ─────────────────────────────────────
@router.patch("/recipients/{recipient_id}/approve", summary="Approve recipient")
def approve_recipient(
    recipient_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _review_recipient(db, recipient_id, VerificationStatus.APPROVED, current_user)
    return {"message": "Recipient approved successfully"}


# ── PATCH /admin/recipients/{id}/reject ──────────────────────────────────────
@router.patch("/recipients/{recipient_id}/reject", summary="Reject recipient")
def reject_recipient(
    recipient_id: str,
    payload: dict,
    db: Database = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reason = payload.get("reason", "Documents insufficient")
    _review_recipient(db, recipient_id, VerificationStatus.REJECTED, current_user, reason)
    return {"message": "Recipient rejected"}


# ── GET /admin/reports ────────────────────────────────────────────────────────
@router.get("/reports", summary="List reports")
def get_reports(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = {}
    if status:
        query["status"] = status

    offset = (page - 1) * limit
    cursor = db["reports"].find(query).sort("created_at", -1).skip(offset).limit(limit)

    results = []
    for doc in cursor:
        rep = Report.from_doc(doc)
        reporter_doc = db["users"].find_one({"$or": [{"_id": str(rep.reporter_id)}, {"id": str(rep.reporter_id)}]}) if rep.reporter_id else None
        listing_doc = db["listings"].find_one({"$or": [{"_id": str(rep.listing_id)}, {"id": str(rep.listing_id)}]}) if rep.listing_id else None

        reason_val = rep.reason.value if hasattr(rep.reason, "value") else str(rep.reason or "")
        status_val = rep.status.value if hasattr(rep.status, "value") else str(rep.status or "OPEN")
        created_at_str = rep.created_at.isoformat() if hasattr(rep.created_at, "isoformat") else str(rep.created_at or "")
        resolved_at_str = rep.resolved_at.isoformat() if hasattr(rep.resolved_at, "isoformat") and rep.resolved_at else (str(rep.resolved_at) if rep.resolved_at else None)

        listing_title = (listing_doc.get("medicine_name") if listing_doc else None) or f"Listing #{str(rep.listing_id)[:8]}"
        reporter_name = (reporter_doc.get("name") if reporter_doc else None) or "Anonymous"

        results.append({
            "id": str(rep.id),
            "listingId": str(rep.listing_id),
            "listingTitle": listing_title,
            "reporterId": str(rep.reporter_id),
            "reporterName": reporter_name,
            "reporter": {"id": str(reporter_doc["_id"]), "name": reporter_name} if reporter_doc else None,
            "listing": {"id": str(rep.listing_id), "medicineName": listing_title} if listing_doc else None,
            "reason": reason_val,
            "description": rep.description or "",
            "status": status_val,
            "resolutionNote": rep.resolution_note,
            "createdAt": created_at_str,
            "resolvedAt": resolved_at_str,
        })

    return results


# ── PATCH /admin/reports/{id}/resolve ────────────────────────────────────────
@router.patch("/reports/{report_id}/resolve", summary="Resolve report")
def resolve_report(
    report_id: str,
    payload: Optional[dict] = None,
    db: Database = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if payload is None:
        payload = {}

    rep_doc = db["reports"].find_one({"$or": [{"_id": report_id}, {"id": report_id}]})
    if not rep_doc:
        raise ResourceNotFoundError("Report")

    now = datetime.now(timezone.utc)
    db["reports"].update_one(
        {"_id": rep_doc["_id"]},
        {
            "$set": {
                "status": ReportStatus.RESOLVED.value,
                "resolved_by_id": str(current_user.id),
                "resolved_at": now,
                "resolution_note": payload.get("note"),
                "updated_at": now,
            }
        }
    )

    audit_repository.log(
        db, event=AuditEvent.REPORT_RESOLVED,
        user_id=current_user.id, user_name=current_user.name,
        resource_type="Report", resource_id=str(report_id),
    )

    return {"message": "Report resolved"}


# ── GET /admin/audit-logs ─────────────────────────────────────────────────────
@router.get("/audit-logs", summary="Get audit logs")
def get_audit_logs(
    event: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = {}
    if event:
        query["event"] = event

    total = db["audit_logs"].count_documents(query)
    offset = (page - 1) * limit
    cursor = db["audit_logs"].find(query).sort("created_at", -1).skip(offset).limit(limit)

    logs = []
    for doc in cursor:
        log = AuditLog.from_doc(doc)
        c_at = log.created_at.isoformat() if hasattr(log.created_at, "isoformat") else str(log.created_at or "")
        res_label = f"{log.resource_type or 'Resource'}: {str(log.resource_id)[:8]}" if log.resource_id else (log.resource_type or "System")

        logs.append({
            "id": str(log.id),
            "event": log.event.value if hasattr(log.event, "value") else str(log.event),
            "userId": str(log.user_id) if log.user_id else "",
            "userName": log.user_name or "System",
            "resource": res_label,
            "resourceType": log.resource_type,
            "resourceId": log.resource_id,
            "detail": log.detail,
            "ipAddress": log.ip_address,
            "timestamp": c_at,
            "createdAt": c_at,
        })

    return {
        "data": logs,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit if limit else 1,
    }


# ── GET /admin/users ──────────────────────────────────────────────────────────
@router.get("/users", summary="List all users")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = Query(None),
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = {"is_active": {"$ne": False}}
    if role:
        query["role"] = role

    total = db["users"].count_documents(query)
    offset = (page - 1) * limit
    cursor = db["users"].find(query).sort("created_at", -1).skip(offset).limit(limit)

    users = []
    for doc in cursor:
        u = User.from_doc(doc)
        c_at = u.created_at.isoformat() if hasattr(u.created_at, "isoformat") else str(u.created_at or "")
        role_str = u.role.value if hasattr(u.role, "value") else str(u.role or "")
        donor_str = u.donor_type.value if hasattr(u.donor_type, "value") else (str(u.donor_type) if u.donor_type else None)
        org_str = u.organization_type.value if hasattr(u.organization_type, "value") else (str(u.organization_type) if u.organization_type else None)
        ver_str = u.verification_status.value if hasattr(u.verification_status, "value") else (str(u.verification_status) if u.verification_status else None)

        users.append({
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": role_str,
            "donorType": donor_str,
            "organizationName": u.organization_name,
            "organizationType": org_str,
            "verificationStatus": ver_str,
            "isActive": u.is_active,
            "createdAt": c_at,
        })

    return users


# ── GET /admin/listings ───────────────────────────────────────────────────────
@router.get("/listings", summary="Admin: list all listings")
def get_all_listings(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = {}
    if status:
        query["status"] = status

    total = db["listings"].count_documents(query)
    offset = (page - 1) * limit
    cursor = db["listings"].find(query).sort("created_at", -1).skip(offset).limit(limit)

    listings = []
    for doc in cursor:
        l = Listing.from_doc(doc)
        listings.append(listing_to_dict(l, db=db))

    return {
        "data": listings,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit if limit else 1,
    }


# ── GET /admin/analytics ──────────────────────────────────────────────────────
@router.get("/analytics", summary="Impact analytics")
def get_analytics(
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users = db["users"].count_documents({"is_active": {"$ne": False}})
    total_listings = db["listings"].count_documents({})
    total_claims = db["claims"].count_documents({})
    completed_claims = db["claims"].count_documents({"status": ClaimStatus.COMPLETED.value})

    pipeline_sum = [
        {"$match": {"status": ClaimStatus.COMPLETED.value}},
        {"$group": {"_id": None, "total": {"$sum": "$requested_quantity"}}}
    ]
    sum_res = list(db["claims"].aggregate(pipeline_sum))
    total_units_donated = sum_res[0]["total"] if sum_res else 0

    completion_rate = round((completed_claims / total_claims * 100) if total_claims > 0 else 0, 1)

    # Group completed listings by category
    pipeline_cat = [
        {"$match": {"status": ListingStatus.COMPLETED.value}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    cat_res = list(db["listings"].aggregate(pipeline_cat))
    top_categories = [
        {"category": item["_id"] or "General", "count": item["count"]}
        for item in cat_res if item.get("_id")
    ]

    return {
        "totalUsers": total_users,
        "totalListings": total_listings,
        "totalClaims": total_claims,
        "completedDonations": completed_claims,
        "totalUnitsDonated": int(total_units_donated),
        "completionRate": completion_rate,
        "topCategories": top_categories,
    }
