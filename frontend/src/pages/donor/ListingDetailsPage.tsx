import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, ImageIcon, PackageCheck, Pill, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useListing } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/utils/formatDate';
import { getUrgencyConfig } from '@/utils/statusHelpers';
import { getMediaUrl } from '@/utils/mediaUrl';
import { cn } from '@/utils/cn';

export function ListingDetailsPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data: listing, isLoading, isError, refetch } = useListing(id);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const urgency = listing ? getUrgencyConfig(listing.urgency) : null;

  const donorPhone = listing?.donorPhone || listing?.donor?.phone || (user?.id === listing?.donorId ? user?.phone : '') || '—';
  const donorEmail = listing?.donorEmail || listing?.donor?.email || (user?.id === listing?.donorId ? user?.email : '') || '—';

  const resolvedImageUrl = listing?.imageUrl ? getMediaUrl(listing.imageUrl) : '';

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
            <div className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{listing.medicine?.name ?? 'Medicine'}</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {listing.medicine?.genericName ?? ''} · {listing.medicine?.strength ?? 'Standard'}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={listing.status} />
                  {urgency && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        urgency.className,
                      )}
                    >
                      {urgency.label} urgency
                    </span>
                  )}
                </div>
              </div>

              {/* Medicine Image Under Name & Urgency */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-primary" /> Medicine Photo
                  </span>
                  {resolvedImageUrl && !imageError && (
                    <button
                      type="button"
                      onClick={() => setShowImageModal(true)}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="size-3.5" /> View full image
                    </button>
                  )}
                </div>

                {resolvedImageUrl && !imageError ? (
                  <div
                    onClick={() => setShowImageModal(true)}
                    className="group relative h-60 w-full overflow-hidden rounded-xl border border-border bg-background cursor-pointer shadow-inner transition-all hover:border-primary/50"
                  >
                    <img
                      src={resolvedImageUrl}
                      alt={listing.medicine?.name ?? 'Medicine packaging'}
                      onError={() => setImageError(true)}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="rounded-full bg-surface/90 px-3 py-1.5 text-xs font-semibold text-text-primary shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                        <Eye className="size-3.5 text-primary" /> Click to enlarge
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/50 p-8 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner mb-3">
                      <Pill className="size-7" />
                    </div>
                    <p className="text-xs font-semibold text-text-primary">
                      {listing.packagingCondition ? listing.packagingCondition.replace(/_/g, ' ') : 'Sealed Medicine Packaging'}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted max-w-xs">
                      {listing.medicine?.dosageForm || 'Medicine'} package verified under standard donor safety screening
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <PackageCheck className="size-3.5" /> Storage conditions confirmed
                    </div>
                  </div>
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

      {/* Enlarged Image Modal */}
      {showImageModal && resolvedImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-background/50">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" />
                <span className="text-sm font-semibold text-text-primary">
                  {listing?.medicine?.name} — Medicine Packaging Photo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-surface hover:text-text-primary cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/40">
              <img
                src={resolvedImageUrl}
                alt={listing?.medicine?.name ?? 'Medicine photo'}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
