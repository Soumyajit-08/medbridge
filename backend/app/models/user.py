"""
app/models/user.py
──────────────────────────────────────────────────────────────────────────────
User model for MongoDB collection `users`.
"""

from typing import Optional
from app.models.base import BaseDocument
from app.utils.enums import UserRole, DonorType, OrganizationType, VerificationStatus


class User(BaseDocument):
    def __init__(
        self,
        name: str = "",
        email: str = "",
        phone: str = "",
        password_hash: str = "",
        role: UserRole = UserRole.DONOR,
        donor_type: Optional[DonorType] = None,
        organization_name: Optional[str] = None,
        organization_type: Optional[OrganizationType] = None,
        verification_status: Optional[VerificationStatus] = None,
        is_active: bool = True,
        avatar_url: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(
            name=name,
            email=email.lower().strip() if email else "",
            phone=phone,
            password_hash=password_hash,
            role=role if isinstance(role, str) else (role.value if hasattr(role, "value") else str(role)),
            donor_type=donor_type if isinstance(donor_type, str) or donor_type is None else (donor_type.value if hasattr(donor_type, "value") else str(donor_type)),
            organization_name=organization_name,
            organization_type=organization_type if isinstance(organization_type, str) or organization_type is None else (organization_type.value if hasattr(organization_type, "value") else str(organization_type)),
            verification_status=verification_status if isinstance(verification_status, str) or verification_status is None else (verification_status.value if hasattr(verification_status, "value") else str(verification_status)),
            is_active=is_active,
            avatar_url=avatar_url,
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
