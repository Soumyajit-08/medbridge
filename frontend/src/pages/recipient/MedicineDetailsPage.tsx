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

export function MedicineDetailsPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data: listing, isLoading, isError, refetch } = useListing(id);
  const createClaim = useCreateClaim();
  const [submitted, setSubmitted] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isVerified = user?.verificationStatus === 'APPROVED';

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
            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              {listing.imageUrl && !imageError && (
                <img
                  src={listing.imageUrl}
                  alt={listing.medicine?.name ?? 'Medicine'}
                  onError={() => setImageError(true)}
                  className="mb-4 h-48 w-full rounded-lg object-cover"
                />
              )}
              <h2 className="text-xl font-bold text-text-primary">{listing.medicine?.name || 'Medicine'}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {listing.medicine?.genericName || ''}{listing.medicine?.manufacturer ? ` · ${listing.medicine.manufacturer}` : ''}
              </p>
              <div className="mt-4">
                <StatusBadge status={listing.status} />
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
    </>
  );
}
