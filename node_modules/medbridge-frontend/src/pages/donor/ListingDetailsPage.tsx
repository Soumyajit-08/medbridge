import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useListing } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/utils/formatDate';
import { getUrgencyConfig } from '@/utils/statusHelpers';
import { cn } from '@/utils/cn';

export function ListingDetailsPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data: listing, isLoading, isError, refetch } = useListing(id);
  const [imageError, setImageError] = useState(false);

  const urgency = listing ? getUrgencyConfig(listing.urgency) : null;

  const donorPhone = listing?.donorPhone || listing?.donor?.phone || (user?.id === listing?.donorId ? user?.phone : '') || '—';
  const donorEmail = listing?.donorEmail || listing?.donor?.email || (user?.id === listing?.donorId ? user?.email : '') || '—';

  return (
    <>
      <PageHeader
        title="Listing details"
        actions={
          <Link to={ROUTES.donor.listings}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to listings
            </Button>
          </Link>
        }
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        {listing && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              {listing.imageUrl && !imageError && (
                <img
                  src={listing.imageUrl}
                  alt={listing.medicine?.name ?? 'Medicine'}
                  onError={() => setImageError(true)}
                  className="mb-4 h-48 w-full rounded-lg object-cover"
                />
              )}
              <h2 className="text-xl font-bold text-text-primary">{listing.medicine?.name ?? 'Medicine'}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {listing.medicine?.genericName ?? ''} · {listing.medicine?.strength ?? ''}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge status={listing.status} />
                {urgency && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                      urgency.className,
                    )}
                  >
                    {urgency.label} urgency
                  </span>
                )}
              </div>
            </div>

            <dl className="space-y-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              {[
                ['Batch number', listing.batchNumber],
                ['Expiry date', formatDate(listing.expiryDate)],
                ['Days remaining', listing.daysRemaining ?? '—'],
                ['Quantity available', listing.quantityAvailable],
                ['Location', [listing.location?.city, listing.location?.state].filter(Boolean).join(', ') || '—'],
                ['Packaging', listing.packagingCondition ? listing.packagingCondition.replace('_', ' ') : '—'],
                ['Mobile number', donorPhone],
                ['Email address', donorEmail],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-text-primary">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </QueryState>
    </>
  );
}
