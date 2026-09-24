"""
app/models/base.py
──────────────────────────────────────────────────────────────────────────────
Base document class for MongoDB collections in MedBridge.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional


class BaseDocument:
    """
    Base document for all MongoDB models.
    Supports attribute access (doc.id), dictionary access (doc['id']),
    and seamless serialization/deserialization with MongoDB documents.
    """

    def __init__(self, **kwargs):
        self._data: Dict[str, Any] = {}
        for key, value in kwargs.items():
            self._data[key] = value

        # Ensure id, _id, created_at, updated_at
        if "id" not in self._data:
            if "_id" in self._data:
                self._data["id"] = str(self._data["_id"])
            else:
                new_id = str(uuid.uuid4())
                self._data["id"] = new_id
                self._data["_id"] = new_id
        elif "_id" not in self._data:
            self._data["_id"] = str(self._data["id"])

        now = datetime.now(timezone.utc)
        if "created_at" not in self._data or self._data["created_at"] is None:
            self._data["created_at"] = now
        if "updated_at" not in self._data or self._data["updated_at"] is None:
            self._data["updated_at"] = now

    def __getattr__(self, name: str) -> Any:
        if name.startswith("_"):
            return super().__getattribute__(name)
        if name in self._data:
            return self._data[name]
        return None

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "_data" or name.startswith("_"):
            super().__setattr__(name, value)
        else:
            if not hasattr(self, "_data"):
                super().__setattr__("_data", {})
            self._data[name] = value

    def __getitem__(self, key: str) -> Any:
        return self._data.get(key)

    def __setitem__(self, key: str, value: Any) -> None:
        self._data[key] = value

    def __contains__(self, key: str) -> bool:
        return key in self._data

    def to_dict(self) -> Dict[str, Any]:
        return dict(self._data)

    def to_doc(self) -> Dict[str, Any]:
        doc = dict(self._data)
        if "id" in doc and "_id" not in doc:
            doc["_id"] = str(doc["id"])
        return doc

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]):
        if doc is None:
            return None
        data = dict(doc)
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        return cls(**data)

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"
