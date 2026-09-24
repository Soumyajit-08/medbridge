"""
app/auth/permissions.py
──────────────────────────────────────────────────────────────────────────────
Role-based access control (RBAC) utilities.

These are used together with get_current_user (in core/dependencies.py)
to protect routes by role.

USAGE IN ROUTERS:
  # Only ADMIN can access this:
  @router.get("/admin/dashboard")
  def dashboard(current_user = Depends(require_admin)):
      ...

  # Only DONOR role:
  @router.post("/listings")
  def create_listing(current_user = Depends(require_donor)):
      ...

  # Any authenticated user:
  @router.get("/notifications")
  def get_notifications(current_user = Depends(require_authenticated)):
      ...

OBJECT-LEVEL AUTHORIZATION:
  Role checks alone aren't enough. You also need to verify that a user
  can only modify THEIR OWN resources.
  Use the is_owner() helper inside services:

    if not is_owner(current_user, listing.donor_id):
        raise AuthorizationError()
"""

from app.utils.enums import UserRole
from app.utils.exceptions import AuthorizationError


def require_role(*allowed_roles: UserRole):
    """
    Create a permission checker for specific roles.

    Usage (creates a reusable function):
        require_donor_or_admin = require_role(UserRole.DONOR, UserRole.ADMIN)

    Then use in a router as a dependency.
    """
    def check(user) -> None:
        if user.role not in allowed_roles:
            raise AuthorizationError(
                f"This action requires one of these roles: {[r.value for r in allowed_roles]}"
            )
    return check


def check_is_admin(user) -> None:
    """Raises AuthorizationError if user is not ADMIN."""
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("Admin access required")


def check_is_donor(user) -> None:
    """Raises AuthorizationError if user is not DONOR."""
    if user.role != UserRole.DONOR:
        raise AuthorizationError("Donor access required")


def check_is_recipient(user) -> None:
    """Raises AuthorizationError if user is not RECIPIENT."""
    if user.role != UserRole.RECIPIENT:
        raise AuthorizationError("Recipient access required")


def is_owner(current_user, resource_owner_id: str) -> bool:
    """
    Check if the current user owns a resource.

    Use this inside services to prevent users from modifying other
    users' data (even if they have the right role).

    Example:
        listing = listing_repo.get_by_id(listing_id)
        if not is_owner(current_user, listing.donor_id):
            raise AuthorizationError("You can only edit your own listings")
    """
    return str(current_user.id) == str(resource_owner_id)


def is_owner_or_admin(current_user, resource_owner_id: str) -> bool:
    """Returns True if user is the owner OR an admin."""
    return is_owner(current_user, resource_owner_id) or current_user.role == UserRole.ADMIN
