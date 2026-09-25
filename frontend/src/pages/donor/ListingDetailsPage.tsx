import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Eye, ImageIcon, PackageCheck, Pill, Upload, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useListing } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { listingService } from '@/services/listingService';
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
  const [isUploading, setIsUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const urgency = listing ? getUrgencyConfig(listing.urgency) : null;

  const isOwner = user && listing && (user.id === listing.donorId || user.id === listing.donor?.id);
  const donorPhone = listing?.donorPhone || listing?.donor?.phone || (isOwner ? user?.phone : '') || '—';
  const donorEmail = listing?.donorEmail || listing?.donor?.email || (isOwner ? user?.email : '') || '—';

  const resolvedImageUrl = customImageUrl || (listing?.imageUrl ? getMediaUrl(listing.imageUrl) : '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !listing) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setCustomImageUrl(localPreview);
    setImageError(false);
    setIsUploading(true);

    try {
      const updated = await listingService.uploadImage(listing.id, file);
      if (updated.imageUrl) {
        setCustomImageUrl(getMediaUrl(updated.imageUrl));
      }
      refetch();
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploading(false);
    }
  };

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
            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
                  {listing.medicine?.name ?? 'Medicine'}
                </h2>
                <p className="mt-1 text-sm font-medium text-text-secondary">
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

              {/* Medicine Image Preview Under Name & Urgency */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-primary" /> Medicine Image Preview
                  </span>
                  <div className="flex items-center gap-2">
                    {resolvedImageUrl && !imageError && (
                      <button
                        type="button"
                        onClick={() => setShowImageModal(true)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="size-3.5" /> Enlarge
                      </button>
                    )}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs font-semibold text-text-secondary hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Camera className="size-3.5" /> {resolvedImageUrl && !imageError ? 'Change photo' : 'Add photo'}
                      </button>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {resolvedImageUrl && !imageError ? (
                  <div
                    onClick={() => setShowImageModal(true)}
                    className="group relative h-64 w-full overflow-hidden rounded-2xl border border-border bg-background cursor-pointer shadow-md transition-all hover:border-primary/60"
                  >
                    <img
                      src={resolvedImageUrl}
                      alt={listing.medicine?.name ?? 'Medicine packaging'}
                      onError={() => setImageError(true)}
                      className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                      <span className="rounded-full bg-surface/95 px-3.5 py-1.5 text-xs font-bold text-text-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 backdrop-blur-sm">
                        <Eye className="size-3.5 text-primary" /> Click to view full resolution
                      </span>
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="size-6 border-2 border-white border-t-transparent animate-spin rounded-full mx-auto mb-2" />
                          <p className="text-xs font-semibold">Uploading photo...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/60 p-8 text-center transition-all hover:border-primary/40">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-indigo-500/10 text-primary shadow-inner mb-3.5">
                      <Pill className="size-8" />
                    </div>
                    <p className="text-sm font-bold text-text-primary">
                      {listing.medicine?.name || 'Medicine'} ({listing.medicine?.dosageForm || 'Tablet'})
                    </p>
                    <p className="mt-1 text-xs text-text-secondary max-w-xs">
                      Packaging: <span className="font-semibold text-text-primary capitalize">{listing.packagingCondition ? listing.packagingCondition.replace(/_/g, ' ').toLowerCase() : 'Sealed intact'}</span>
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      <PackageCheck className="size-3.5" /> Storage conditions verified
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
                      >
                        <Upload className="size-3.5" /> {isUploading ? 'Uploading...' : 'Upload Medicine Photo'}
                      </button>
                    )}
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
