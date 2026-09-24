"""
app/routers/medicines.py
──────────────────────────────────────────────────────────────────────────────
Medicine catalogue endpoints.

GET  /medicines         → Search medicines by name/generic name (autocomplete)
GET  /medicines/{id}    → Get single medicine detail
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.medicine import Medicine
from app.models.user import User
from app.utils.exceptions import ResourceNotFoundError

router = APIRouter(prefix="/medicines", tags=["Medicines"])


def medicine_to_dict(m: Medicine) -> dict:
    return {
        "id": str(m.id),
        "name": m.name,
        "genericName": m.generic_name,
        "category": m.category,
        "manufacturer": m.manufacturer,
        "dosageForm": m.dosage_form,
        "strength": m.strength,
        "isRestricted": m.is_restricted,
    }


@router.get("", summary="Search medicine catalogue")
def search_medicines(
    q: Optional[str] = Query(None, description="Search query (name or generic name)"),
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    GET /api/v1/medicines?q=paracetamol

    Searches medicines by name OR generic_name (case-insensitive).
    Used by the listing form's medicine autocomplete input.
    """
    query = db.query(Medicine).filter(Medicine.is_active == True)

    if q:
        q_lower = q.lower().strip()
        query = query.filter(
            or_(
                func.lower(Medicine.name).contains(q_lower),
                func.lower(Medicine.generic_name).contains(q_lower),
            )
        )

    if category:
        query = query.filter(func.lower(Medicine.category) == category.lower())

    medicines = query.order_by(Medicine.name).limit(limit).all()
    return [medicine_to_dict(m) for m in medicines]


@router.get("/{medicine_id}", summary="Get medicine detail")
def get_medicine(
    medicine_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """GET /api/v1/medicines/{id}"""
    import uuid
    try:
        mid = uuid.UUID(medicine_id)
    except ValueError:
        raise ResourceNotFoundError("Medicine")

    med = db.query(Medicine).filter(Medicine.id == mid, Medicine.is_active == True).first()
    if not med:
        raise ResourceNotFoundError("Medicine")

    return medicine_to_dict(med)
