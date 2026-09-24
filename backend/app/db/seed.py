"""
app/db/seed.py
──────────────────────────────────────────────────────────────────────────────
Database seed script — creates essential test data in MongoDB.

WHAT IT CREATES:
  - 1 ADMIN user
  - 2 DONOR users (1 pharmacy, 1 household)
  - 2 RECIPIENT users (1 NGO, 1 hospital) — both APPROVED
  - 20+ Medicine catalogue entries
  - Verification submissions for recipients
  - Sample listings & claims

HOW TO RUN:
  python -m app.db.seed
"""

import sys
import os
import uuid
from datetime import datetime, timezone, timedelta, date

# ── Add backend root to path ──────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.mongodb import get_mongodb
from app.models.user import User
from app.models.medicine import Medicine
from app.models.listing import Listing
from app.models.claim import Claim
from app.models.verification_submission import VerificationSubmission
from app.auth.password import hash_password
from app.utils.enums import (
    UserRole, DonorType, OrganizationType, VerificationStatus,
    ListingStatus, PackagingCondition, ClaimStatus, UrgencyLevel
)


SEED_USERS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "MedBridge Admin",
        "email": "admin@medbridge.dev",
        "phone": "+91-9000000001",
        "password": "Admin@123456",
        "role": UserRole.ADMIN,
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "name": "Apollo Pharmacy",
        "email": "donor1@medbridge.dev",
        "phone": "+91-9000000002",
        "password": "Donor@123456",
        "role": UserRole.DONOR,
        "donor_type": DonorType.PHARMACY,
        "address": "123 Healthcare Ave, Sector 4",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "name": "Rahul Sharma",
        "email": "donor2@medbridge.dev",
        "phone": "+91-9000000003",
        "password": "Donor@123456",
        "role": UserRole.DONOR,
        "donor_type": DonorType.HOUSEHOLD,
        "address": "45 Green Park, Flat 3B",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400050",
    },
    {
        "id": "44444444-4444-4444-4444-444444444444",
        "name": "Aasha Foundation",
        "email": "recipient1@medbridge.dev",
        "phone": "+91-9000000004",
        "password": "Recip@123456",
        "role": UserRole.RECIPIENT,
        "organization_name": "Aasha Foundation",
        "organization_type": OrganizationType.NGO,
        "verification_status": VerificationStatus.APPROVED,
        "address": "78 Hope Street, Bandra",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400050",
    },
    {
        "id": "55555555-5555-5555-5555-555555555555",
        "name": "City General Hospital",
        "email": "recipient2@medbridge.dev",
        "phone": "+91-9000000005",
        "password": "Recip@123456",
        "role": UserRole.RECIPIENT,
        "organization_name": "City General Hospital",
        "organization_type": OrganizationType.HOSPITAL,
        "verification_status": VerificationStatus.APPROVED,
        "address": "100 Central Road, Dadar",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400014",
    },
]


SEED_MEDICINES = [
    # Analgesics / Antipyretics
    {"name": "Paracetamol 500mg", "generic_name": "Paracetamol", "category": "Analgesic/Antipyretic",
     "manufacturer": "Cipla Ltd.", "dosage_form": "Tablet", "strength": "500mg"},
    {"name": "Ibuprofen 400mg", "generic_name": "Ibuprofen", "category": "NSAID",
     "manufacturer": "Sun Pharma", "dosage_form": "Tablet", "strength": "400mg"},
    {"name": "Diclofenac Sodium 50mg", "generic_name": "Diclofenac Sodium", "category": "NSAID",
     "manufacturer": "Dr. Reddy's", "dosage_form": "Tablet", "strength": "50mg"},

    # Antibiotics
    {"name": "Amoxicillin 500mg", "generic_name": "Amoxicillin", "category": "Antibiotic",
     "manufacturer": "Cipla Ltd.", "dosage_form": "Capsule", "strength": "500mg"},
    {"name": "Azithromycin 500mg", "generic_name": "Azithromycin", "category": "Antibiotic",
     "manufacturer": "Pfizer India", "dosage_form": "Tablet", "strength": "500mg"},
    {"name": "Cetirizine 10mg", "generic_name": "Cetirizine Hydrochloride", "category": "Antihistamine",
     "manufacturer": "Sun Pharma", "dosage_form": "Tablet", "strength": "10mg"},
    {"name": "Levofloxacin 500mg", "generic_name": "Levofloxacin", "category": "Antibiotic",
     "manufacturer": "Dr. Reddy's", "dosage_form": "Tablet", "strength": "500mg", "is_restricted": True},

    # Cardiovascular
    {"name": "Amlodipine 5mg", "generic_name": "Amlodipine Besylate", "category": "Calcium Channel Blocker",
     "manufacturer": "Cipla Ltd.", "dosage_form": "Tablet", "strength": "5mg"},
    {"name": "Metformin 500mg", "generic_name": "Metformin Hydrochloride", "category": "Antidiabetic",
     "manufacturer": "Sun Pharma", "dosage_form": "Tablet", "strength": "500mg"},
    {"name": "Atorvastatin 10mg", "generic_name": "Atorvastatin Calcium", "category": "Statin",
     "manufacturer": "Pfizer India", "dosage_form": "Tablet", "strength": "10mg"},
    {"name": "Losartan 50mg", "generic_name": "Losartan Potassium", "category": "ARB/Antihypertensive",
     "manufacturer": "Dr. Reddy's", "dosage_form": "Tablet", "strength": "50mg"},
    {"name": "Aspirin 75mg", "generic_name": "Acetylsalicylic Acid", "category": "Antiplatelet",
     "manufacturer": "Bayer India", "dosage_form": "Tablet", "strength": "75mg"},

    # Respiratory
    {"name": "Salbutamol 100mcg Inhaler", "generic_name": "Salbutamol Sulphate",
     "category": "Bronchodilator", "manufacturer": "Cipla Ltd.", "dosage_form": "Inhaler", "strength": "100mcg"},
    {"name": "Montelukast 10mg", "generic_name": "Montelukast Sodium", "category": "Leukotriene Antagonist",
     "manufacturer": "Sun Pharma", "dosage_form": "Tablet", "strength": "10mg"},

    # Vitamins / Supplements
    {"name": "Vitamin D3 1000IU", "generic_name": "Cholecalciferol", "category": "Vitamin/Supplement",
     "manufacturer": "Abbott India", "dosage_form": "Tablet", "strength": "1000IU"},
    {"name": "Vitamin B Complex", "generic_name": "Vitamin B Complex", "category": "Vitamin/Supplement",
     "manufacturer": "Cipla Ltd.", "dosage_form": "Tablet", "strength": "Standard"},
    {"name": "Ferrous Sulphate 200mg", "generic_name": "Ferrous Sulphate", "category": "Mineral Supplement",
     "manufacturer": "Dr. Reddy's", "dosage_form": "Tablet", "strength": "200mg"},

    # Gastro
    {"name": "Omeprazole 20mg", "generic_name": "Omeprazole", "category": "Proton Pump Inhibitor",
     "manufacturer": "Sun Pharma", "dosage_form": "Capsule", "strength": "20mg"},
    {"name": "Pantoprazole 40mg", "generic_name": "Pantoprazole Sodium", "category": "Proton Pump Inhibitor",
     "manufacturer": "Cipla Ltd.", "dosage_form": "Tablet", "strength": "40mg"},
    {"name": "Ondansetron 4mg", "generic_name": "Ondansetron Hydrochloride", "category": "Antiemetic",
     "manufacturer": "Pfizer India", "dosage_form": "Tablet", "strength": "4mg"},

    # Restricted (for testing admin oversight)
    {"name": "Tramadol 50mg", "generic_name": "Tramadol Hydrochloride", "category": "Opioid Analgesic",
     "manufacturer": "Sun Pharma", "dosage_form": "Capsule", "strength": "50mg", "is_restricted": True},
    {"name": "Alprazolam 0.25mg", "generic_name": "Alprazolam", "category": "Benzodiazepine",
     "manufacturer": "Cipla Ltd.", "dosage_form": "Tablet", "strength": "0.25mg", "is_restricted": True},
]


def seed_users(db) -> dict:
    users = {}
    created = 0
    skipped = 0

    for u in SEED_USERS:
        existing = db["users"].find_one({"email": u["email"]})
        if existing:
            users[u["email"]] = existing
            skipped += 1
            continue

        uid = u.get("id", str(uuid.uuid4()))
        role_val = u["role"].value if hasattr(u["role"], "value") else str(u["role"])
        donor_type_val = u["donor_type"].value if u.get("donor_type") and hasattr(u["donor_type"], "value") else u.get("donor_type")
        org_type_val = u["organization_type"].value if u.get("organization_type") and hasattr(u["organization_type"], "value") else u.get("organization_type")
        ver_status_val = u["verification_status"].value if u.get("verification_status") and hasattr(u["verification_status"], "value") else u.get("verification_status")

        user_doc = {
            "_id": uid,
            "id": uid,
            "name": u["name"],
            "email": u["email"],
            "phone": u["phone"],
            "password_hash": hash_password(u["password"]),
            "role": role_val,
            "donor_type": donor_type_val,
            "organization_name": u.get("organization_name"),
            "organization_type": org_type_val,
            "verification_status": ver_status_val,
            "address": u.get("address"),
            "city": u.get("city"),
            "state": u.get("state"),
            "pincode": u.get("pincode"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        db["users"].insert_one(user_doc)
        users[u["email"]] = user_doc
        created += 1

    print(f"  Users: {created} created, {skipped} skipped")
    return users


def seed_medicines(db) -> dict:
    medicines = {}
    created = 0
    skipped = 0

    for m in SEED_MEDICINES:
        existing = db["medicines"].find_one({"name": m["name"]})
        if existing:
            medicines[m["name"]] = existing
            skipped += 1
            continue

        med_id = str(uuid.uuid4())
        med_doc = {
            "_id": med_id,
            "id": med_id,
            "name": m["name"],
            "generic_name": m["generic_name"],
            "category": m["category"],
            "manufacturer": m["manufacturer"],
            "dosage_form": m["dosage_form"],
            "strength": m["strength"],
            "is_restricted": m.get("is_restricted", False),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        db["medicines"].insert_one(med_doc)
        medicines[m["name"]] = med_doc
        created += 1

    print(f"  Medicines: {created} created, {skipped} skipped")
    return medicines


def seed_listings(db, users: dict, medicines: dict):
    created = 0
    donor1 = users.get("donor1@medbridge.dev")
    donor2 = users.get("donor2@medbridge.dev")
    if not donor1 or not donor2:
        return

    today = date.today()

    sample_listings = [
        {
            "medicine_name": "Paracetamol 500mg",
            "quantity": 50,
            "expiry_date": (today + timedelta(days=25)).isoformat(),
            "batch_number": "PARA-2024-01",
            "packaging_condition": PackagingCondition.SEALED.value,
            "storage_conditions": "Store below 25°C in dry place",
            "donor": donor1,
            "status": ListingStatus.ACTIVE.value,
            "urgency": UrgencyLevel.MEDIUM.value,
        },
        {
            "medicine_name": "Amoxicillin 500mg",
            "quantity": 20,
            "expiry_date": (today + timedelta(days=6)).isoformat(),
            "batch_number": "AMOX-2024-88",
            "packaging_condition": PackagingCondition.SEALED.value,
            "storage_conditions": "Room temperature",
            "donor": donor1,
            "status": ListingStatus.ACTIVE.value,
            "urgency": UrgencyLevel.HIGH.value,
        },
        {
            "medicine_name": "Metformin 500mg",
            "quantity": 100,
            "expiry_date": (today + timedelta(days=90)).isoformat(),
            "batch_number": "MET-2024-12",
            "packaging_condition": PackagingCondition.SEALED.value,
            "storage_conditions": "Store in cool, dry place",
            "donor": donor2,
            "status": ListingStatus.ACTIVE.value,
            "urgency": UrgencyLevel.LOW.value,
        },
        {
            "medicine_name": "Azithromycin 500mg",
            "quantity": 15,
            "expiry_date": (today + timedelta(days=2)).isoformat(),
            "batch_number": "AZI-2024-05",
            "packaging_condition": PackagingCondition.OPENED_BLISTER.value,
            "storage_conditions": "Room temperature",
            "donor": donor2,
            "status": ListingStatus.ACTIVE.value,
            "urgency": UrgencyLevel.CRITICAL.value,
        },
        {
            "medicine_name": "Vitamin D3 1000IU",
            "quantity": 60,
            "expiry_date": (today + timedelta(days=120)).isoformat(),
            "batch_number": "VIT-2024-99",
            "packaging_condition": PackagingCondition.SEALED.value,
            "storage_conditions": "Protect from direct sunlight",
            "donor": donor1,
            "status": ListingStatus.COMPLETED.value,
            "urgency": UrgencyLevel.LOW.value,
        },
    ]

    for item in sample_listings:
        med = medicines.get(item["medicine_name"])
        existing = db["listings"].find_one({"batch_number": item["batch_number"]})
        if existing:
            continue

        lid = str(uuid.uuid4())
        listing_doc = {
            "_id": lid,
            "id": lid,
            "donor_id": str(item["donor"]["_id"]),
            "medicine_id": str(med["_id"]) if med else None,
            "medicine_name": item["medicine_name"],
            "generic_name": med.get("generic_name") if med else "",
            "category": med.get("category") if med else "",
            "manufacturer": med.get("manufacturer") if med else "",
            "dosage_form": med.get("dosage_form") if med else "",
            "strength": med.get("strength") if med else "",
            "quantity": item["quantity"],
            "batch_number": item["batch_number"],
            "expiry_date": item["expiry_date"],
            "packaging_condition": item["packaging_condition"],
            "storage_conditions": item["storage_conditions"],
            "status": item["status"],
            "urgency": item["urgency"],
            "pickup_address": item["donor"].get("address", "123 Main St"),
            "city": item["donor"].get("city", "Mumbai"),
            "state": item["donor"].get("state", "Maharashtra"),
            "pincode": item["donor"].get("pincode", "400001"),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        db["listings"].insert_one(listing_doc)
        created += 1

    print(f"  Listings: {created} created")


def seed_verifications(db, users: dict):
    rec1 = users.get("recipient1@medbridge.dev")
    rec2 = users.get("recipient2@medbridge.dev")
    admin = users.get("admin@medbridge.dev")

    for rec in [rec1, rec2]:
        if not rec:
            continue
        existing = db["verification_submissions"].find_one({
            "$or": [{"user_id": str(rec["_id"])}, {"recipient_id": str(rec["_id"])}]
        })
        if not existing:
            sub_id = str(uuid.uuid4())
            sub_doc = {
                "_id": sub_id,
                "id": sub_id,
                "user_id": str(rec["_id"]),
                "recipient_id": str(rec["_id"]),
                "organization_name": rec.get("organization_name", rec.get("name")),
                "organization_type": rec.get("organization_type", "NGO"),
                "registration_number": "REG-" + str(uuid.uuid4())[:8].upper(),
                "documents": ["/uploads/verification/sample_doc.pdf"],
                "document_url": "/uploads/verification/sample_doc.pdf",
                "document_name": "sample_registration_doc.pdf",
                "status": VerificationStatus.APPROVED.value,
                "reviewed_by_id": str(admin["_id"]) if admin else None,
                "reviewed_at": datetime.now(timezone.utc),
                "created_at": datetime.now(timezone.utc) - timedelta(days=5),
                "updated_at": datetime.now(timezone.utc),
            }
            db["verification_submissions"].insert_one(sub_doc)


def run_seed():
    """Main seed runner for MongoDB."""
    print("=" * 60)
    print("MedBridge MongoDB Database Seed")
    print("=" * 60)

    db = get_mongodb()
    try:
        print("\nSeeding users...")
        users = seed_users(db)

        print("Seeding medicines...")
        medicines = seed_medicines(db)

        print("Seeding verifications...")
        seed_verifications(db, users)

        print("Seeding sample listings...")
        seed_listings(db, users, medicines)

        print("\nSUCCESS: MongoDB Seed completed successfully!")

        print("\n" + "=" * 60)
        print("TEST CREDENTIALS")
        print("=" * 60)
        for u in SEED_USERS:
            role = u["role"].value if hasattr(u["role"], "value") else str(u["role"])
            print(f"\n  [{role}]")
            print(f"  Email:    {u['email']}")
            print(f"  Password: {u['password']}")
            if u.get("organization_name"):
                print(f"  Org:      {u['organization_name']}")
        print("\n" + "=" * 60)

    except Exception as e:
        print(f"\nFAILED: Seed failed: {e}")
        raise


if __name__ == "__main__":
    run_seed()
