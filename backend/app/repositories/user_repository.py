"""
app/repositories/user_repository.py
──────────────────────────────────────────────────────────────────────────────
User repository — MongoDB operations for `users` collection.
"""

from typing import Optional, List, Tuple
from pymongo.database import Database
from app.models.user import User
from app.utils.enums import UserRole, VerificationStatus
from app.db.mongodb import get_users_collection


class UserRepository:
    """
    MongoDB operations for the User model.
    """

    def get_by_id(self, db: Optional[Database], user_id: str) -> Optional[User]:
        col = db["users"] if db is not None else get_users_collection()
        uid = str(user_id)
        doc = col.find_one({"$or": [{"_id": uid}, {"id": uid}], "is_active": True})
        return User.from_doc(doc) if doc else None

    def get_by_email(self, db: Optional[Database], email: str) -> Optional[User]:
        col = db["users"] if db is not None else get_users_collection()
        doc = col.find_one({
            "email": {"$regex": f"^{email.strip()}$", "$options": "i"},
            "is_active": True,
        })
        return User.from_doc(doc) if doc else None

    def email_exists(self, db: Optional[Database], email: str) -> bool:
        col = db["users"] if db is not None else get_users_collection()
        count = col.count_documents({
            "email": {"$regex": f"^{email.strip()}$", "$options": "i"}
        })
        return count > 0

    def create(
        self,
        db: Optional[Database],
        *,
        name: str,
        email: str,
        phone: str,
        password_hash: str,
        role: UserRole,
        donor_type=None,
        organization_name: Optional[str] = None,
        organization_type=None,
    ) -> User:
        col = db["users"] if db is not None else get_users_collection()
        verification_status = None
        if role == UserRole.RECIPIENT or role == "RECIPIENT":
            verification_status = VerificationStatus.PENDING

        user = User(
            name=name,
            email=email.lower().strip(),
            phone=phone,
            password_hash=password_hash,
            role=role,
            donor_type=donor_type,
            organization_name=organization_name,
            organization_type=organization_type,
            verification_status=verification_status,
        )

        col.insert_one(user.to_doc())
        return user

    def update_verification_status(
        self,
        db: Optional[Database],
        user_id: str,
        status: VerificationStatus,
    ) -> Optional[User]:
        col = db["users"] if db is not None else get_users_collection()
        uid = str(user_id)
        status_val = status.value if hasattr(status, "value") else str(status)
        col.update_one(
            {"$or": [{"_id": uid}, {"id": uid}]},
            {"$set": {"verification_status": status_val}}
        )
        return self.get_by_id(db, uid)

    def deactivate(self, db: Optional[Database], user_id: str) -> Optional[User]:
        col = db["users"] if db is not None else get_users_collection()
        uid = str(user_id)
        col.update_one(
            {"$or": [{"_id": uid}, {"id": uid}]},
            {"$set": {"is_active": False}}
        )
        return self.get_by_id(db, uid)

    def get_all(
        self,
        db: Optional[Database],
        offset: int = 0,
        limit: int = 50,
    ) -> Tuple[List[User], int]:
        col = db["users"] if db is not None else get_users_collection()
        query = {"is_active": True}
        total = col.count_documents(query)
        cursor = col.find(query).sort("created_at", -1).skip(offset).limit(limit)
        users = [User.from_doc(doc) for doc in cursor]
        return users, total


user_repository = UserRepository()
