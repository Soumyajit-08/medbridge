"""
app/routers/notifications.py
──────────────────────────────────────────────────────────────────────────────
Notification endpoints.

GET  /notifications            → Get my notifications (paginated)
PATCH /notifications/{id}/read  → Mark one as read
POST /notifications/read-all   → Mark all as read
"""

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.utils.exceptions import ResourceNotFoundError, AuthorizationError

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def notif_to_dict(n: Notification) -> dict:
    return {
        "id": str(n.id),
        "userId": str(n.user_id),
        "listingId": str(n.listing_id) if n.listing_id else None,
        "claimId": str(n.claim_id) if n.claim_id else None,
        "type": n.type.value,
        "title": n.title,
        "message": n.message,
        "link": n.link,
        "read": n.read,
        "createdAt": n.created_at.isoformat(),
    }


@router.get("", summary="Get my notifications")
def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    total = query.count()
    unread_count = query.filter(Notification.read == False).count()
    offset = (page - 1) * limit
    notifs = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "data": [notif_to_dict(n) for n in notifs],
        "total": total,
        "unreadCount": unread_count,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit,
    }


@router.patch("/{notification_id}/read", summary="Mark notification as read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        nid = uuid.UUID(notification_id)
    except ValueError:
        raise ResourceNotFoundError("Notification")

    notif = db.query(Notification).filter(Notification.id == nid).first()
    if not notif:
        raise ResourceNotFoundError("Notification")

    if str(notif.user_id) != str(current_user.id):
        raise AuthorizationError("Not your notification")

    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif_to_dict(notif)


@router.post("/read-all", summary="Mark all notifications as read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False,
    ).update({"read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}", summary="Delete notification")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        nid = uuid.UUID(notification_id)
    except ValueError:
        raise ResourceNotFoundError("Notification")

    notif = db.query(Notification).filter(Notification.id == nid).first()
    if not notif:
        raise ResourceNotFoundError("Notification")

    if str(notif.user_id) != str(current_user.id):
        raise AuthorizationError("Not your notification")

    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}
