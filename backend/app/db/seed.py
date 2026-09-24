"""
app/db/seed.py
──────────────────────────────────────────────────────────────────────────────
Database seed script — creates essential test data.

WHAT IT CREATES:
  - 1 ADMIN user
  - 2 DONOR users (1 pharmacy, 1 household)
  - 2 RECIPIENT users (1 NGO, 1 hospital) — both APPROVED
  - 20+ Medicine catalogue entries (realistic data)

WHY SEED?
  - Lets us test the full flow without clicking through forms
  - Ensures consistent test data across dev machines
  - Provides data for dashboard stats

HOW TO RUN:
  python -m app.db.seed

SAFETY:
  - Checks for existing data before inserting (idempotent)
  - Uses test passwords (NOT production-safe)
"""

import sys
import os

# ── Add backend root to path ──────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.medicine import Medicine
from app.auth.password import hash_password
from app.utils.enums import UserRole, DonorType, OrganizationType, VerificationStatus


# ── Test credentials (printed after seeding) ─────────────────────────────────
SEED_USERS = [
    {
        "name": "MedBridge Admin",
        "email": "admin@medbridge.dev",
        "phone": "+91-9000000001",
        "password": "Admin@123456",
        "role": UserRole.ADMIN,
    },
    {
        "name": "Apollo Pharmacy",
        "email": "donor1@medbridge.dev",
        "phone": "+91-9000000002",
        "password": "Donor@123456",
        "role": UserRole.DONOR,
        "donor_type": DonorType.PHARMACY,
    },
    {
        "name": "Rahul Sharma",
        "email": "donor2@medbridge.dev",
        "phone": "+91-9000000003",
        "password": "Donor@123456",
        "role": UserRole.DONOR,
        "donor_type": DonorType.HOUSEHOLD,
    },
    {
        "name": "Aasha Foundation",
        "email": "recipient1@medbridge.dev",
        "phone": "+91-9000000004",
        "password": "Recip@123456",
        "role": UserRole.RECIPIENT,
        "organization_name": "Aasha Foundation",
        "organization_type": OrganizationType.NGO,
        "verification_status": VerificationStatus.APPROVED,
    },
    {
        "name": "City General Hospital",
        "email": "recipient2@medbridge.dev",
        "phone": "+91-9000000005",
        "password": "Recip@123456",
        "role": UserRole.RECIPIENT,
        "organization_name": "City General Hospital",
        "organization_type": OrganizationType.HOSPITAL,
        "verification_status": VerificationStatus.APPROVED,
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


def seed_users(db: Session) -> dict:
    """Create seed users. Returns dict of email → user object."""
    users = {}
    created = 0
    skipped = 0

    for u in SEED_USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            users[u["email"]] = existing
            skipped += 1
            continue

        user = User(
            name=u["name"],
            email=u["email"],
            phone=u["phone"],
            password_hash=hash_password(u["password"]),
            role=u["role"],
            donor_type=u.get("donor_type"),
            organization_name=u.get("organization_name"),
            organization_type=u.get("organization_type"),
            verification_status=u.get("verification_status"),
        )
        db.add(user)
        db.flush()
        users[u["email"]] = user
        created += 1

    print(f"  Users: {created} created, {skipped} skipped")
    return users


def seed_medicines(db: Session) -> dict:
    """Create seed medicines. Returns dict of name → medicine object."""
    medicines = {}
    created = 0
    skipped = 0

    for m in SEED_MEDICINES:
        existing = db.query(Medicine).filter(Medicine.name == m["name"]).first()
        if existing:
            medicines[m["name"]] = existing
            skipped += 1
            continue

        med = Medicine(
            name=m["name"],
            generic_name=m["generic_name"],
            category=m["category"],
            manufacturer=m["manufacturer"],
            dosage_form=m["dosage_form"],
            strength=m["strength"],
            is_restricted=m.get("is_restricted", False),
        )
        db.add(med)
        db.flush()
        medicines[m["name"]] = med
        created += 1

    print(f"  Medicines: {created} created, {skipped} skipped")
    return medicines


def run_seed():
    """Main seed runner."""
    print("=" * 60)
    print("MedBridge Database Seed")
    print("=" * 60)

    db: Session = SessionLocal()
    try:
        print("\nSeeding users...")
        users = seed_users(db)

        print("Seeding medicines...")
        medicines = seed_medicines(db)

        db.commit()
        print("\nSUCCESS: Seed completed successfully!")  # noqa: unicode-safe

        print("\n" + "=" * 60)
        print("TEST CREDENTIALS")
        print("=" * 60)
        for u in SEED_USERS:
            role = u["role"].value
            print(f"\n  [{role}]")
            print(f"  Email:    {u['email']}")
            print(f"  Password: {u['password']}")
            if u.get("organization_name"):
                print(f"  Org:      {u['organization_name']}")
        print("\n" + "=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\nFAILED: Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
