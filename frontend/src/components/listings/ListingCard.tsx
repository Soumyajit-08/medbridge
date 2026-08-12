import { Building2, Home, Pill, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DonorType } from '@/types/auth';
import type { Listing } from '@/types/listing';
import { ROUTES } from '@/lib/constants';
import { StatusBadge } from '@/components/common/StatusBadge';
import { UrgencyBadge } from '@/components/urgency/UrgencyBadge';
import { ExpiryCountdown } from '@/components/urgency/ExpiryCountdown';
import { DistanceBadge } from '@/components/location/DistanceBadge';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

const donorTypeConfig: Record<
  DonorType,
  { label: string; icon: typeof Home }
> = {
  HOUSEHOLD: { label: 'Household', icon: Home },
  PHARMACY: { label: 'Pharmacy', icon: Store },
  AUTHORIZED_ORGANIZATION: { label: 'Authorized Org', icon: Building2 },
};

export interface ListingCardProps {
  listing: Listing;
  className?: string;
  linkTo?: string;
}

export function ListingCard({ listing, className, linkTo }: ListingCardProps) {
  const donorConfig = donorTypeConfig[listing.donorType];
  const DonorIcon = donorConfig.icon;
  const href = linkTo ?? ROUTES.recipient.medicineDetails(listing.id);

  return (
    <Link
      to={href}
      className={cn(
        'block rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]',
        'transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-[var(--radius-card)] bg-background">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.medicine.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-text-secondary">
            <Pill className="size-12 opacity-40" aria-hidden="true" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <UrgencyBadge urgency={listing.urgency} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text-primary line-clamp-1">
            {listing.medicine.name}
          </h3>
          <StatusBadge status={listing.status} />
        </div>

        <p className="text-sm text-text-secondary">
          Qty: {listing.quantityAvailable} available
        </p>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <ExpiryCountdown
            expiryDate={listing.expiryDate}
            daysRemaining={listing.daysRemaining}
          />
          <span className="text-text-secondary" aria-hidden="true">·</span>
          <span className="text-text-secondary">{formatDate(listing.expiryDate)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DistanceBadge distanceKm={listing.location.approximateDistanceKm} />
          <span
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-text-secondary"
          >
            <DonorIcon className="size-3 shrink-0" aria-hidden="true" />
            {donorConfig.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
