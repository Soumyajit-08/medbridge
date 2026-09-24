"""
app/models/medicine.py
──────────────────────────────────────────────────────────────────────────────
Medicine model for MongoDB collection `medicines`.
"""

from typing import Optional
from app.models.base import BaseDocument


class Medicine(BaseDocument):
    def __init__(
        self,
        name: str = "",
        generic_name: str = "",
        category: str = "",
        manufacturer: Optional[str] = None,
        dosage_form: Optional[str] = None,
        strength: Optional[str] = None,
        schedule_type: Optional[str] = None,
        is_restricted: bool = False,
        **kwargs,
    ):
        super().__init__(
            name=name,
            generic_name=generic_name,
            category=category,
            manufacturer=manufacturer,
            dosage_form=dosage_form,
            strength=strength,
            schedule_type=schedule_type,
            is_restricted=is_restricted,
            **kwargs,
        )

    def __repr__(self) -> str:
        return f"<Medicine id={self.id} name={self.name}>"
