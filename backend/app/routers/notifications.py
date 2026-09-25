"""
app/routers/notifications.py
──────────────────────────────────────────────────────────────────────────────
Notification endpoints for MongoDB.
"""

from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.utils.exceptions import ResourceNotFoundError, AuthorizationError

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def notif_to_dict(n: Notification) -> dict:
    type_val = n.type if isinstance(n.type, str) else getattr(n.type, "value", str(n.type))
    created_at_val = n.created_at.isoformat() if hasattr(n.created_at, "isoformat") else str(n.created_at or "")

    return {
        "id": str(n.id),
        "userId": str(n.user_id),
        "listingId": str(n.listing_id) if n.listing_id else None,
        "claimId": str(n.claim_id) if n.claim_id else None,
        "type": type_val,
        "title": n.title,
        "message": n.message,
        "link": n.link,
        "read": bool(n.read or n.is_read),
        "createdAt": created_at_val,
    }


import uuid
from datetime import datetime, timezone


@router.get("", summary="Get my notifications")
def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_val = current_user.role if isinstance(current_user.role, str) else getattr(current_user.role, "value", str(current_user.role))
    now = datetime.now(timezone.utc)

    # For ADMIN users, ensure pending verification requests appear in notifications
    if role_val == "ADMIN":
        pending_recipients = list(db["users"].find({
            "role": "RECIPIENT",
            "verification_status": "PENDING",
            "is_active": {"$ne": False}
        }))
        for rec in pending_recipients:
            rec_id = str(rec.get("_id") or rec.get("id"))
            existing = db["notifications"].find_one({
                "user_id": str(current_user.id),
                "type": "VERIFICATION_SUBMITTED",
                "$or": [
                    {"recipient_id": rec_id},
                    {"link": f"/admin/verifications/{rec_id}"},
                ]
            })
            if not existing:
                notif_id = str(uuid.uuid4())
                org_name = rec.get("organization_name") or rec.get("name") or "Recipient Organization"
                org_type = rec.get("organization_type") or "NGO"
                db["notifications"].insert_one({
                    "_id": notif_id,
                    "id": notif_id,
                    "user_id": str(current_user.id),
                    "recipient_id": rec_id,
                    "type": "VERIFICATION_SUBMITTED",
                    "title": f"Pending Verification: {org_name}",
                    "message": f"Recipient '{rec.get('name')}' ({rec.get('email')}) is awaiting {org_type} verification approval.",
                    "link": "/admin/verifications",
                    "read": False,
                    "is_read": False,
                    "created_at": rec.get("created_at") or now,
                })

    query = {"user_id": str(current_user.id)}
    total = db["notifications"].count_documents(query)
    unread_count = db["notifications"].count_documents({
        "user_id": str(current_user.id),
        "$or": [{"read": False}, {"is_read": False}, {"read": {"$exists": False}}],
    })

    offset = (page - 1) * limit
    cursor = db["notifications"].find(query).sort("created_at", -1).skip(offset).limit(limit)
    notifs = [Notification.from_doc(doc) for doc in cursor]

    return {
        "data": [notif_to_dict(n) for n in notifs],
        "total": total,
        "unreadCount": unread_count,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.patch("/{notification_id}/read", summary="Mark notification as read")
def mark_read(
    notification_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    nid = str(notification_id)
    doc = db["notifications"].find_one({"$or": [{"_id": nid}, {"id": nid}]})
    if not doc:
        raise ResourceNotFoundError("Notification")

    if str(doc.get("user_id")) != str(current_user.id):
        raise AuthorizationError("Not your notification")

    db["notifications"].update_one(
        {"$or": [{"_id": nid}, {"id": nid}]},
        {"$set": {"read": True, "is_read": True}}
    )
    doc["read"] = True
    doc["is_read"] = True
    return notif_to_dict(Notification.from_doc(doc))


@router.post("/read-all", summary="Mark all notifications as read")
def mark_all_read(
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db["notifications"].update_many(
        {"user_id": str(current_user.id)},
        {"$set": {"read": True, "is_read": True}}
    )
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}", summary="Delete notification")
def delete_notification(
    notification_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    nid = str(notification_id)
    doc = db["notifications"].find_one({"$or": [{"_id": nid}, {"id": nid}]})
    if not doc:
        raise ResourceNotFoundError("Notification")

    if str(doc.get("user_id")) != str(current_user.id):
        raise AuthorizationError("Not your notification")

    db["notifications"].delete_one({"$or": [{"_id": nid}, {"id": nid}]})
    return {"message": "Notification deleted"}
