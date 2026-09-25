import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/feedback/Alert';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useListing } from '@/hooks/useListings';
import { useCreateClaim } from '@/hooks/useClaims';
import { useAuth } from '@/hooks/useAuth';
import { claimRequestSchema, type ClaimRequestFormData } from '@/schemas/claimSchemas';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/utils/formatDate';

import { getMediaUrl } from '@/utils/mediaUrl';
import { Eye, ImageIcon, Pill, X } from 'lucide-react';

export function MedicineDetailsPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data: listing, isLoading, isError, refetch } = useListing(id);
  const createClaim = useCreateClaim();
  const [submitted, setSubmitted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const isVerified = user?.verificationStatus === 'APPROVED';

  const resolvedImageUrl = listing?.imageUrl ? getMediaUrl(listing.imageUrl) : '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimRequestFormData>({
    resolver: zodResolver(claimRequestSchema),
    defaultValues: { requestedQuantity: 1 },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!isVerified || !listing) return;
    await createClaim.mutateAsync({ listingId: listing.id, requestedQuantity: data.requestedQuantity });
    setSubmitted(true);
  });

  return (
    <>
      <PageHeader
        title="Medicine details"
        actions={
          <Link to={ROUTES.recipient.medicines}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to browse
            </Button>
          </Link>
        }
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        {listing && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{listing.medicine?.name || 'Medicine'}</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {listing.medicine?.genericName || ''}{listing.medicine?.manufacturer ? ` · ${listing.medicine.manufacturer}` : ''}
                </p>
                <div className="mt-4">
                  <StatusBadge status={listing.status} />
                </div>
              </div>

              {/* Medicine Photo Under Name */}
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
                      <Eye className="size-3.5" /> Enlarge
                    </button>
                  )}
                </div>

                {resolvedImageUrl && !imageError ? (
                  <div
                    onClick={() => setShowImageModal(true)}
                    className="group relative h-56 w-full overflow-hidden rounded-xl border border-border bg-background cursor-pointer shadow-inner transition-all hover:border-primary/50"
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
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/50 p-6 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner mb-2">
                      <Pill className="size-6" />
                    </div>
                    <p className="text-xs font-semibold text-text-primary">
                      {listing.packagingCondition ? listing.packagingCondition.replace(/_/g, ' ') : 'Verified Packaging'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      Original manufacturer packaging confirmed by donor
                    </p>
                  </div>
                )}
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div>
                  <dt className="text-text-secondary">Available quantity</dt>
                  <dd className="font-medium text-text-primary">{listing.quantityAvailable}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Expiry</dt>
                  <dd className="font-medium text-text-primary">{formatDate(listing.expiryDate)}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Location</dt>
                  <dd className="font-medium text-text-primary">
                    {[listing.location?.city, listing.location?.state].filter(Boolean).join(', ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Donor</dt>
                  <dd className="font-medium text-text-primary">{listing.donorName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Mobile number</dt>
                  <dd className="font-medium text-text-primary">{listing.donorPhone || listing.donor?.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Email address</dt>
                  <dd className="font-medium text-text-primary">{listing.donorEmail || listing.donor?.email || '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="text-lg font-semibold text-text-primary">Request claim</h3>

              {!isVerified && (
                <Alert variant="warning" title="Verification required" className="mt-4">
                  Verification required before claiming medicines.
                </Alert>
              )}

              {submitted ? (
                <Alert variant="success" title="Claim submitted" className="mt-4">
                  Your claim request has been sent to the donor for review.
                </Alert>
              ) : (
                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                  {createClaim.isError && (
                    <Alert variant="error">Unable to submit claim. Please try again.</Alert>
                  )}

                  <Input
                    label="Requested quantity"
                    type="number"
                    min={1}
                    max={listing.quantityAvailable}
                    error={errors.requestedQuantity?.message}
                    disabled={!isVerified}
                    {...register('requestedQuantity')}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isVerified}
                    isLoading={createClaim.isPending}
                  >
                    {isVerified ? 'Submit claim request' : 'Verification required before claiming medicines.'}
                  </Button>
                </form>
              )}
            </div>
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
