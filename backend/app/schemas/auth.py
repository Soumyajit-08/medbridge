"""
app/schemas/auth.py
──────────────────────────────────────────────────────────────────────────────
Pydantic v2 schemas for authentication endpoints.

WHY SCHEMAS?
  Schemas = the "contract" between frontend and backend.
  They define:
    - What the request body must look like (request schemas)
    - What the response will look like (response schemas)

  Pydantic automatically:
    - Validates types (email must be a valid email, not just any string)
    - Validates constraints (password must be at least 8 chars)
    - Strips unknown fields (extra fields in request are ignored)
    - Serializes to JSON

NAMING CONVENTION:
  *Request  → Incoming data from the frontend (e.g., LoginRequest)
  *Response → Data we return to the frontend (e.g., AuthResponse)

REQUEST FLOW:
  Frontend sends JSON body
    → FastAPI reads it
      → Pydantic validates against the schema
        → If invalid: 422 Unprocessable Entity (automatic, not our code)
        → If valid: route handler receives clean Python object
"""

from pydantic import AliasChoices, BaseModel, EmailStr, Field, model_validator
from typing import Optional
from app.utils.enums import UserRole, DonorType, OrganizationType, VerificationStatus


# ── Sub-schemas ───────────────────────────────────────────────────────────────

class AuthUserResponse(BaseModel):
    """
    The user object returned to the frontend after login/register.
    This matches the frontend's AuthUser TypeScript interface exactly:

    interface AuthUser {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: UserRole;
      donorType?: DonorType;
      organizationName?: string;
      organizationType?: OrganizationType;
      verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
      avatarUrl?: string;
    }

    IMPORTANT: We do NOT include password_hash or any sensitive fields here.
    """
    id: str
    name: str
    email: str
    phone: str
    role: UserRole
    donor_type: Optional[DonorType] = None
    organization_name: Optional[str] = None
    organization_type: Optional[OrganizationType] = None
    verification_status: Optional[VerificationStatus] = None
    avatar_url: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    model_config = {
        "from_attributes": True,  # allows creating from model / dict (model_validate(user))
        # Map snake_case DB field names to camelCase for the frontend
        "populate_by_name": True,
    }

    # The frontend expects camelCase keys.
    # We use alias_generator or explicit aliases.
    @classmethod
    def from_user(cls, user) -> "AuthUserResponse":
        """Build an AuthUserResponse from a User model or document."""
        return cls(
            id=str(user.id),
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            donor_type=user.donor_type,
            organization_name=user.organization_name,
            organization_type=user.organization_type,
            verification_status=user.verification_status,
            avatar_url=user.avatar_url,
            address=getattr(user, "address", None) or (user.get("address") if isinstance(user, dict) else None),
            city=getattr(user, "city", None) or (user.get("city") if isinstance(user, dict) else None),
            state=getattr(user, "state", None) or (user.get("state") if isinstance(user, dict) else None),
            pincode=getattr(user, "pincode", None) or (user.get("pincode") if isinstance(user, dict) else None),
        )

    def model_dump_camel(self) -> dict:
        """Return dict with camelCase keys matching the frontend TypeScript interface."""
        data = self.model_dump()
        role_val = data["role"].value if hasattr(data["role"], "value") else str(data["role"])
        donor_type_val = data["donor_type"].value if hasattr(data["donor_type"], "value") and data["donor_type"] else (str(data["donor_type"]) if data["donor_type"] else None)
        org_type_val = data["organization_type"].value if hasattr(data["organization_type"], "value") and data["organization_type"] else (str(data["organization_type"]) if data["organization_type"] else None)
        ver_val = data["verification_status"].value if hasattr(data["verification_status"], "value") and data["verification_status"] else (str(data["verification_status"]) if data["verification_status"] else None)

        return {
            "id": data["id"],
            "name": data["name"],
            "email": data["email"],
            "phone": data["phone"],
            "role": role_val,
            "donorType": donor_type_val,
            "organizationName": data["organization_name"],
            "organizationType": org_type_val,
            "verificationStatus": ver_val,
            "avatarUrl": data["avatar_url"],
            "address": data.get("address"),
            "city": data.get("city"),
            "state": data.get("state"),
            "pincode": data.get("pincode"),
        }


# ── Request Schemas ────────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    """
    PATCH /api/v1/auth/profile body.
    Supports updating editable profile fields for any role.
    """
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    phone: Optional[str] = Field(None, min_length=5, max_length=20)
    donor_type: Optional[DonorType] = Field(
        default=None,
        validation_alias=AliasChoices("donor_type", "donorType"),
    )
    organization_name: Optional[str] = Field(
        default=None,
        max_length=300,
        validation_alias=AliasChoices("organization_name", "organizationName"),
    )
    organization_type: Optional[OrganizationType] = Field(
        default=None,
        validation_alias=AliasChoices("organization_type", "organizationType"),
    )
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class LoginRequest(BaseModel):
    """
    POST /api/v1/auth/login body.
    """
    email: EmailStr
    password: str = Field(min_length=1)
    portal: Optional[str] = None  # "ADMIN" | "USER"


class RegisterDonorRequest(BaseModel):
    """Registration payload for a DONOR user."""
    role: UserRole = UserRole.DONOR
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=5, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    donor_type: DonorType


class RegisterRecipientRequest(BaseModel):
    """Registration payload for a RECIPIENT user."""
    role: UserRole = UserRole.RECIPIENT
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=5, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    organization_name: str = Field(min_length=2, max_length=300)
    organization_type: OrganizationType


class RegisterRequest(BaseModel):
    """
    POST /api/v1/auth/register body.

    The frontend sends a single payload that can be for DONOR or RECIPIENT.
    We use a @model_validator to check which role and validate accordingly.

    Frontend RegisterData type:
      type RegisterData = RegisterDonorData | RegisterRecipientData;
    """
    role: UserRole
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=5, max_length=20)
    password: str = Field(min_length=8, max_length=128)

    # Donor-only fields
    donor_type: Optional[DonorType] = Field(
      default=None,
      validation_alias=AliasChoices("donor_type", "donorType"),
    )

    # Recipient-only fields
    organization_name: Optional[str] = Field(
        default=None,
        max_length=300,
        validation_alias=AliasChoices("organization_name", "organizationName"),
    )
    organization_type: Optional[OrganizationType] = Field(
        default=None,
        validation_alias=AliasChoices("organization_type", "organizationType"),
    )

    @model_validator(mode="after")
    def validate_role_fields(self) -> "RegisterRequest":
        """
        Cross-field validation — ensures role-specific fields are present.

        If role == DONOR: donor_type is required.
        If role == RECIPIENT: organization_name + organization_type are required.
        """
        if self.role == UserRole.DONOR:
            if not self.donor_type:
                raise ValueError("donor_type is required for DONOR registration")
        elif self.role == UserRole.RECIPIENT:
            if not self.organization_name:
                raise ValueError("organization_name is required for RECIPIENT registration")
            if not self.organization_type:
                raise ValueError("organization_type is required for RECIPIENT registration")
        elif self.role == UserRole.ADMIN:
            raise ValueError("ADMIN accounts cannot be self-registered")
        return self


class RefreshRequest(BaseModel):
    """
    POST /api/v1/auth/refresh.
    The frontend sends the refresh token via HTTP cookie (withCredentials: true).
    This body schema is empty — the token comes from the cookie.
    """
    pass


class ForgotPasswordRequest(BaseModel):
    """POST /api/v1/auth/forgot-password"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """POST /api/v1/auth/reset-password"""
    token: str
    password: str = Field(min_length=8, max_length=128)


# ── Response Schemas ──────────────────────────────────────────────────────────

class AuthResponse(BaseModel):
    """
    The response for login and register endpoints.

    Frontend AuthResponse interface:
      interface AuthResponse {
        user: AuthUser;
        accessToken: string;
      }

    Note: The refresh token is NOT in the response body.
    It's set as an HttpOnly cookie by the router.
    """
    user: dict   # We return the camelCase dict directly
    accessToken: str


class MessageResponse(BaseModel):
    """Generic success message response."""
    success: bool = True
    message: str
