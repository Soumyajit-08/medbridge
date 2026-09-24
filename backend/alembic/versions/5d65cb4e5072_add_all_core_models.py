"""add_all_core_models

Revision ID: 5d65cb4e5072
Revises: 
Create Date: 2026-09-17

NOTE: This migration is written with raw SQL (op.execute) instead of
SQLAlchemy table constructs in order to avoid the enum auto-creation
conflict when PostgreSQL enum types already exist from prior schema setup.

All enum types are created with `DO $$ ... IF NOT EXISTS ... $$` guards.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d65cb4e5072'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _enum_safe(op, name: str, *values: str) -> None:
    """Create a PostgreSQL enum only if it doesn't already exist.
    Uses direct DDL (not EXECUTE string) to avoid single-quote issues.
    """
    vals = ", ".join(f"'{v}'" for v in values)
    op.execute(sa.text(f"""
        DO $body$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{name}') THEN
                CREATE TYPE {name} AS ENUM ({vals});
            END IF;
        END
        $body$;
    """))


def upgrade() -> None:
    # ── Step 1: Create all enum types safely ─────────────────────────────────
    _enum_safe(op, 'packagingcondition', 'SEALED_INTACT', 'DAMAGED')
    _enum_safe(op, 'urgencylevel', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EXPIRED')
    _enum_safe(op, 'listingstatus', 'ACTIVE', 'CLAIM_PENDING', 'CLAIMED', 'COMPLETED', 'EXPIRED', 'REMOVED')
    _enum_safe(op, 'claimstatus', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')
    _enum_safe(op, 'needstatus', 'ACTIVE', 'MATCHED', 'FULFILLED', 'EXPIRED', 'CANCELLED')
    _enum_safe(op, 'verificationstatus', 'PENDING', 'APPROVED', 'REJECTED')
    _enum_safe(op, 'notificationtype',
               'NEW_MATCH', 'CLAIM_REQUEST', 'CLAIM_CONFIRMED', 'CLAIM_CANCELLED',
               'EXPIRY_7_DAYS', 'EXPIRY_3_DAYS', 'EXPIRY_1_DAY', 'LISTING_EXPIRED',
               'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED',
               'REPORT_CREATED', 'REPORT_RESOLVED', 'PICKUP_REMINDER')
    _enum_safe(op, 'reportreason',
               'EXPIRED_MEDICINE', 'COUNTERFEIT_SUSPECTED', 'DAMAGED_PACKAGING',
               'INCORRECT_INFORMATION', 'FRAUDULENT_LISTING', 'SAFETY_CONCERN', 'OTHER')
    _enum_safe(op, 'reportstatus', 'PENDING', 'OPEN', 'RESOLVED', 'DISMISSED')

    # ── Step 2: Create tables via raw SQL (avoids SQLAlchemy enum auto-create) ─
    op.execute("""
        CREATE TABLE IF NOT EXISTS medicines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(300) NOT NULL,
            generic_name VARCHAR(300) NOT NULL,
            category VARCHAR(100) NOT NULL,
            manufacturer VARCHAR(300) NOT NULL,
            dosage_form VARCHAR(100) NOT NULL,
            strength VARCHAR(100) NOT NULL,
            is_restricted BOOLEAN NOT NULL DEFAULT FALSE,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS listings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
            batch_number VARCHAR(100) NOT NULL,
            expiry_date DATE NOT NULL,
            quantity INTEGER NOT NULL,
            quantity_available INTEGER NOT NULL,
            packaging_condition packagingcondition NOT NULL,
            storage_confirmed BOOLEAN NOT NULL,
            safety_checklist JSONB,
            eligibility_screening_passed BOOLEAN NOT NULL DEFAULT FALSE,
            image_url VARCHAR(1000),
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            postal_code VARCHAR(20) NOT NULL,
            latitude FLOAT,
            longitude FLOAT,
            urgency urgencylevel NOT NULL DEFAULT 'LOW',
            status listingstatus NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS needs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
            quantity_needed INTEGER NOT NULL,
            urgency urgencylevel NOT NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            description TEXT,
            match_count INTEGER NOT NULL DEFAULT 0,
            status needstatus NOT NULL DEFAULT 'ACTIVE',
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS verification_submissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            registration_number VARCHAR(200) NOT NULL,
            document_url VARCHAR(1000),
            document_name VARCHAR(300),
            status verificationstatus NOT NULL DEFAULT 'PENDING',
            reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
            rejection_reason TEXT,
            submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            reviewed_at TIMESTAMPTZ,
            UNIQUE(recipient_id)
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS claims (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            requested_quantity INTEGER NOT NULL,
            cancellation_reason VARCHAR(500),
            status claimstatus NOT NULL DEFAULT 'PENDING',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            confirmed_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            cancelled_at TIMESTAMPTZ
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
            reason reportreason NOT NULL,
            description TEXT,
            status reportstatus NOT NULL DEFAULT 'PENDING',
            resolution_note TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            resolved_at TIMESTAMPTZ
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
            claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
            type notificationtype NOT NULL,
            title VARCHAR(300) NOT NULL,
            message TEXT NOT NULL,
            link VARCHAR(500),
            read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    # ── Step 3: Create indexes ─────────────────────────────────────────────────
    # medicines
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicines_id ON medicines(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicines_name ON medicines(name)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicines_generic_name ON medicines(generic_name)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicines_category ON medicines(category)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicines_name_trgm ON medicines(name)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicines_generic_name_trgm ON medicines(generic_name)")

    # listings
    op.execute("CREATE INDEX IF NOT EXISTS ix_listings_id ON listings(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_listings_donor_id ON listings(donor_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_listings_medicine_id ON listings(medicine_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_listings_status ON listings(status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_listings_created_at ON listings(created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_listings_donor_status ON listings(donor_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_listings_expiry_date ON listings(expiry_date)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_listings_status_urgency ON listings(status, urgency)")

    # needs
    op.execute("CREATE INDEX IF NOT EXISTS ix_needs_id ON needs(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_needs_recipient_id ON needs(recipient_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_needs_medicine_id ON needs(medicine_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_needs_status ON needs(status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_needs_created_at ON needs(created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_needs_recipient_status ON needs(recipient_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_needs_medicine_status ON needs(medicine_id, status)")

    # verification_submissions
    op.execute("CREATE INDEX IF NOT EXISTS ix_verification_submissions_id ON verification_submissions(id)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_verification_submissions_recipient_id ON verification_submissions(recipient_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_verification_submissions_status ON verification_submissions(status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_verification_submissions_submitted_at ON verification_submissions(submitted_at)")

    # claims
    op.execute("CREATE INDEX IF NOT EXISTS ix_claims_id ON claims(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_claims_listing_id ON claims(listing_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_claims_recipient_id ON claims(recipient_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_claims_status ON claims(status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_claims_created_at ON claims(created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_claims_listing_status ON claims(listing_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_claims_recipient_status ON claims(recipient_id, status)")

    # reports
    op.execute("CREATE INDEX IF NOT EXISTS ix_reports_id ON reports(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reports_reporter_id ON reports(reporter_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reports_listing_id ON reports(listing_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reports_status ON reports(status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reports_created_at ON reports(created_at)")

    # notifications
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_type ON notifications(type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_read ON notifications(read)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications(created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_read ON notifications(user_id, read)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_created ON notifications(user_id, created_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS notifications CASCADE")
    op.execute("DROP TABLE IF EXISTS reports CASCADE")
    op.execute("DROP TABLE IF EXISTS claims CASCADE")
    op.execute("DROP TABLE IF EXISTS verification_submissions CASCADE")
    op.execute("DROP TABLE IF EXISTS needs CASCADE")
    op.execute("DROP TABLE IF EXISTS listings CASCADE")
    op.execute("DROP TABLE IF EXISTS medicines CASCADE")
    op.execute("DROP TYPE IF EXISTS notificationtype")
    op.execute("DROP TYPE IF EXISTS reportstatus")
    op.execute("DROP TYPE IF EXISTS reportreason")
    op.execute("DROP TYPE IF EXISTS verificationstatus")
    op.execute("DROP TYPE IF EXISTS needstatus")
    op.execute("DROP TYPE IF EXISTS claimstatus")
    op.execute("DROP TYPE IF EXISTS listingstatus")
    op.execute("DROP TYPE IF EXISTS urgencylevel")
    op.execute("DROP TYPE IF EXISTS packagingcondition")

