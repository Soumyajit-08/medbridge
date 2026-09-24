"""
app/models/verification_submission.py
──────────────────────────────────────────────────────────────────────────────
VerificationSubmission model for MongoDB collection `verifications`.
"""

from typing import Optional, List, Dict, Any
from app.models.base import BaseDocument
from app.utils.enums import VerificationStatus, OrganizationType


class VerificationSubmission(BaseDocument):
    def __init__(
        self,
        user_id: str = "",
        organization_name: str = "",
        organization_type: OrganizationType = OrganizationType.NGO,
        registration_number: str = "",
        license_number: Optional[str] = None,
        contact_person: str = "",
        contact_phone: str = "",
        address: str = "",
        city: str = "",
        state: str = "",
        postal_code: str = "",
        documents: Optional[List[str]] = None,
        status: VerificationStatus = VerificationStatus.PENDING,
        reviewed_by_id: Optional[str] = None,
        reviewed_at: Any = None,
        rejection_reason: Optional[str] = None,
        notes: Optional[str] = None,
        user: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        super().__init__(
            user_id=str(user_id),
            organization_name=organization_name,
            organization_type=organization_type if isinstance(organization_type, str) else (organization_type.value if hasattr(organization_type, "value") else str(organization_type)),
            registration_number=registration_number,
            license_number=license_number,
            contact_person=contact_person,
            contact_phone=contact_phone,
            address=address,
            city=city,
            state=state,
            postal_code=postal_code,
            documents=documents or [],
            status=status if isinstance(status, str) else (status.value if hasattr(status, "value") else str(status)),
            reviewed_by_id=str(reviewed_by_id) if reviewed_by_id else None,
            reviewed_at=reviewed_at,
            rejection_reason=rejection_reason,
            notes=notes,
            user=user or {},
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<VerificationSubmission id={self.id} org={self.organization_name}>"
