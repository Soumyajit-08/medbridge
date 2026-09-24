"""
app/routers/medicines.py
──────────────────────────────────────────────────────────────────────────────
Medicine catalogue endpoints for MongoDB.
"""

import re
from fastapi import APIRouter, Depends, Query
from pymongo.database import Database
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
        "isRestricted": bool(m.is_restricted),
    }


@router.get("", summary="Search medicine catalogue")
def search_medicines(
    q: Optional[str] = Query(None, description="Search query (name or generic name)"),
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Database = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = {"is_active": {"$ne": False}}

    if q:
        escaped_q = re.escape(q.strip())
        query["$or"] = [
            {"name": {"$regex": escaped_q, "$options": "i"}},
            {"generic_name": {"$regex": escaped_q, "$options": "i"}},
        ]

    if category:
        query["category"] = {"$regex": f"^{category.strip()}$", "$options": "i"}

    cursor = db["medicines"].find(query).sort("name", 1).limit(limit)
    medicines = [Medicine.from_doc(doc) for doc in cursor]
    return [medicine_to_dict(m) for m in medicines]


@router.get("/{medicine_id}", summary="Get medicine detail")
def get_medicine(
    medicine_id: str,
    db: Database = Depends(get_db),
    _: User = Depends(get_current_user),
):
    mid = str(medicine_id)
    doc = db["medicines"].find_one({"$or": [{"_id": mid}, {"id": mid}], "is_active": {"$ne": False}})
    if not doc:
        raise ResourceNotFoundError("Medicine")
    return medicine_to_dict(Medicine.from_doc(doc))
