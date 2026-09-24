"""
app/repositories/audit_repository.py
──────────────────────────────────────────────────────────────────────────────
Audit log repository — MongoDB operations for `audit_logs` collection.
"""

from typing import Optional, List, Tuple
from pymongo.database import Database
from app.models.audit_log import AuditLog
from app.utils.enums import AuditEvent
from app.db.mongodb import get_audit_logs_collection


class AuditRepository:

    def log(
        self,
        db: Optional[Database],
        *,
        event: AuditEvent,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None,
        user_email: Optional[str] = None,
        role: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        detail: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> AuditLog:
        col = db["audit_logs"] if db is not None else get_audit_logs_collection()
        ev_val = event.value if hasattr(event, "value") else str(event)
        log = AuditLog(
            event_type=ev_val,
            event=ev_val,
            user_id=str(user_id) if user_id else None,
            user_name=user_name,
            user_email=user_email,
            role=role,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            detail=detail,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or ({"detail": detail} if detail else {}),
        )
        col.insert_one(log.to_doc())
        return log

    def get_all(
        self,
        db: Optional[Database],
        event_filter: Optional[str] = None,
        offset: int = 0,
        limit: int = 50,
    ) -> Tuple[List[AuditLog], int]:
        col = db["audit_logs"] if db is not None else get_audit_logs_collection()
        query = {}
        if event_filter:
            query = {"$or": [{"event": event_filter}, {"event_type": event_filter}]}
        total = col.count_documents(query)
        cursor = col.find(query).sort("created_at", -1).skip(offset).limit(limit)
        logs = [AuditLog.from_doc(doc) for doc in cursor]
        return logs, total


audit_repository = AuditRepository()
