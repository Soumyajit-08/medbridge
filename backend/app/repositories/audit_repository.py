"""
app/repositories/audit_repository.py
──────────────────────────────────────────────────────────────────────────────
Audit log repository — write-only operations for audit logs.

DESIGN PRINCIPLE: Write-only
  Audit logs should be easy to write (append only) and hard to delete.
  We provide only: create() and query methods.
  No update() or delete() methods.
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.utils.enums import AuditEvent


class AuditRepository:

    def log(
        self,
        db: Session,
        *,
        event: AuditEvent,
        user_id: Optional[uuid.UUID] = None,
        user_name: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        detail: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Create a new audit log entry.

        Usage:
          audit_repo.log(
              db,
              event=AuditEvent.USER_LOGIN,
              user_id=user.id,
              user_name=user.name,
              ip_address=request.client.host,
          )
        """
        log = AuditLog(
            event=event.value,
            user_id=user_id,
            user_name=user_name,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            detail=detail,
            ip_address=ip_address,
        )
        db.add(log)
        db.flush()
        return log

    def get_all(
        self,
        db: Session,
        event_filter: Optional[str] = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[AuditLog], int]:
        """Fetch audit logs for the admin panel."""
        query = db.query(AuditLog)
        if event_filter:
            query = query.filter(AuditLog.event == event_filter)
        total = query.count()
        logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
        return logs, total


audit_repository = AuditRepository()
