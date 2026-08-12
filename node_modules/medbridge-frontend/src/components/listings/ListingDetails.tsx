import type { Listing } from '@/types/listing';
import { MedicineInfoCard } from '@/components/medicines/MedicineInfoCard';
import { LocationCard } from '@/components/location/LocationCard';
import { UrgencyBadge } from '@/components/urgency/UrgencyBadge';
import { ExpiryCountdown } from '@/components/urgency/ExpiryCountdown';
import { ListingStatus } from './ListingStatus';
import { EligibilityResult } from './EligibilityResult';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import { Pill } from 'lucide-react';

export interface ListingDetailsProps {
  listing: Listing;
  className?: string;
  showEligibility?: boolean;
}

export function ListingDetails({
  listing,
  className,
  showEligibility = true,
}: ListingDetailsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">
            {listing.medicine.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ListingStatus status={listing.status} />
            <UrgencyBadge urgency={listing.urgency} />
          </div>
        </div>
      </div>

      {listing.imageUrl && (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border">
          <img
            src={listing.imageUrl}
            alt={listing.medicine.name}
            className="max-h-64 w-full object-cover"
          />
        </div>
      )}

      {!listing.imageUrl && (
        <div className="flex h-48 items-center justify-center rounded-[var(--radius-card)] border border-border bg-background">
          <Pill className="size-16 text-text-secondary/30" aria-hidden="true" />
        </div>
      )}

      <MedicineInfoCard medicine={listing.medicine} />

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <dt className="text-sm text-text-secondary">Batch Number</dt>
          <dd className="mt-1 font-medium text-text-primary">{listing.batchNumber}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <dt className="text-sm text-text-secondary">Quantity Available</dt>
          <dd className="mt-1 font-medium text-text-primary">{listing.quantityAvailable}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <dt className="text-sm text-text-secondary">Expiry Date</dt>
          <dd className="mt-1 font-medium text-text-primary">
            {formatDate(listing.expiryDate)}
          </dd>
          <ExpiryCountdown
            expiryDate={listing.expiryDate}
            daysRemaining={listing.daysRemaining}
            className="mt-1"
          />
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <dt className="text-sm text-text-secondary">Packaging</dt>
          <dd className="mt-1 font-medium text-text-primary">
            {listing.packagingCondition === 'SEALED_INTACT' ? 'Sealed / Intact' : 'Damaged'}
          </dd>
        </div>
      </dl>

      <LocationCard
        city={listing.location.city}
        state={listing.location.state}
        postalCode={listing.location.postalCode}
        approximateDistanceKm={listing.location.approximateDistanceKm}
      />

      {showEligibility && (
        <EligibilityResult passed={listing.eligibilityScreeningPassed} />
      )}
    </div>
  );
}
