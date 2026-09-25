import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Info,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useClaims } from '@/hooks/useClaims';
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import type { Claim } from '@/types/claim';

export function MyClaimsPage() {
  const [searchParams] = useSearchParams();
  const highlightClaimId = searchParams.get('claimId');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useClaims({ page });
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Automatically open modal or highlight if claimId is in URL
  useEffect(() => {
    if (highlightClaimId && data?.data) {
      const target = data.data.find((c) => c.id === highlightClaimId);
      if (target) {
        setSelectedClaim(target);
      }
    }
  }, [highlightClaimId, data?.data]);

  return (
    <>
      <PageHeader
        title="My claims"
        subtitle="Track your medicine claim requests and coordinate pickup with donors"
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No claims yet"
        emptyDescription="Browse available medicines in the catalog and submit a claim request."
      >
        <div className="space-y-4">
          {data?.data.map((claim) => {
            const isConfirmed = claim.status === 'CONFIRMED' || claim.status === 'COMPLETED';
            const donor = claim.donor || claim.listing?.donor;
            const pickupAddress =
              claim.pickupAddress ||
              claim.listing?.pickupAddress ||
              donor?.address ||
              '';
            const pickupCity =
              claim.pickupCity ||
              claim.listing?.city ||
              donor?.city ||
              '';
            const pickupState =
              claim.pickupState ||
              claim.listing?.state ||
              donor?.state ||
              '';
            const fullLocation = [pickupAddress, pickupCity, pickupState]
              .filter(Boolean)
              .join(', ');

            return (
              <article
                key={claim.id}
                id={`claim-${claim.id}`}
                className={cn(
                  'relative rounded-xl border bg-surface p-5 shadow-sm transition-all hover:border-primary/40',
                  highlightClaimId === claim.id ? 'border-primary ring-2 ring-primary/20' : 'border-border',
                  isConfirmed && 'bg-emerald-500/[0.02] border-emerald-500/30',
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Medicine & Claim Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-text-primary">
                        {claim.medicine?.name || 'Medicine'}
                      </h2>
                      {claim.medicine?.strength && (
                        <span className="rounded bg-background px-2 py-0.5 text-xs font-medium text-text-secondary border border-border">
                          {claim.medicine.strength}
                        </span>
                      )}
                      {claim.medicine?.dosageForm && (
                        <span className="rounded bg-background px-2 py-0.5 text-xs font-medium text-text-secondary border border-border">
                          {claim.medicine.dosageForm}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-text-secondary">
                      {claim.medicine?.genericName && <span>{claim.medicine.genericName} · </span>}
                      {claim.medicine?.manufacturer && <span>{claim.medicine.manufacturer} · </span>}
                      <span>Requested: {claim.requestedQuantity} units</span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1" title={formatDateTime(claim.createdAt)}>
                        <Clock className="size-3.5" /> Requested {formatRelativeTime(claim.createdAt)}
                      </span>
                      {claim.confirmedAt && (
                        <span className="flex items-center gap-1 text-emerald-500" title={formatDateTime(claim.confirmedAt)}>
                          <CheckCircle2 className="size-3.5" /> Confirmed {formatRelativeTime(claim.confirmedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & View Button */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <StatusBadge status={claim.status} />
                    <button
                      type="button"
                      onClick={() => setSelectedClaim(claim)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface hover:text-primary"
                    >
                      View details
                    </button>
                  </div>
                </div>

                {/* Confirmed Donor Profile & Direct Contact Box */}
                {isConfirmed && (
                  <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                    <div className="flex items-center justify-between gap-2 border-b border-emerald-500/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-text-primary">
                          Donor Profile & Contact Details
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                          Handover Unlocked
                        </span>
                      </div>
                      {donor?.donorType && (
                        <span className="text-[11px] font-medium text-text-muted capitalize">
                          {String(donor.donorType).toLowerCase()} donor
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                          <User className="size-3.5 text-primary" /> {donor?.name || 'Verified Donor'}
                        </p>
                        {fullLocation && (
                          <p className="mt-1 text-xs text-text-secondary flex items-start gap-1.5">
                            <MapPin className="size-3.5 text-text-muted shrink-0 mt-0.5" />
                            <span>{fullLocation}</span>
                          </p>
                        )}
                      </div>

                      {/* Contact Channels */}
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {donor?.email && (
                          <a
                            href={`mailto:${donor.email}?subject=MedBridge Medicine Pickup: ${claim.medicine?.name || 'Medicine'}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                          >
                            <Mail className="size-3.5" /> Email Donor
                          </a>
                        )}
                        {donor?.phone && (
                          <a
                            href={`tel:${donor.phone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-background"
                          >
                            <Phone className="size-3.5 text-emerald-500" /> Call ({donor.phone})
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Confirmation Notice */}
                {claim.status === 'PENDING' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-background p-2.5 text-xs text-text-secondary border border-border/60">
                    <Info className="size-4 text-amber-500 shrink-0" />
                    <span>
                      Awaiting donor confirmation. Once confirmed, the donor's email, phone number, and pickup address will appear here.
                    </span>
                  </div>
                )}

                {/* Cancelled Notice */}
                {claim.status === 'CANCELLED' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/5 p-2.5 text-xs text-rose-500 border border-rose-500/20">
                    <XCircle className="size-4 shrink-0" />
                    <span>
                      This claim request was cancelled. {claim.cancellationReason ? `Reason: ${claim.cancellationReason}` : ''}
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {data && data.totalPages > 1 && (
          <Pagination
            className="mt-6"
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </QueryState>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background/50">
              <div className="flex items-center gap-2.5">
                <Package className="size-5 text-primary" />
                <h3 className="text-base font-semibold text-text-primary">Claim Details & Contact</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="rounded-lg p-1.5 text-text-secondary hover:bg-surface hover:text-text-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
              {/* Status Header */}
              <div className="flex items-center justify-between rounded-xl bg-background p-4 border border-border">
                <div>
                  <p className="text-xs text-text-muted">Current Claim Status</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">
                    {selectedClaim.status === 'CONFIRMED'
                      ? 'Confirmed & Ready for Handover'
                      : selectedClaim.status === 'PENDING'
                      ? 'Awaiting Donor Review'
                      : selectedClaim.status === 'COMPLETED'
                      ? 'Handover Completed'
                      : 'Cancelled'}
                  </p>
                </div>
                <StatusBadge status={selectedClaim.status} />
              </div>

              {/* Medicine Information */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Medicine Information
                </h4>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 text-xs bg-surface">
                  <div>
                    <span className="text-text-muted">Name</span>
                    <p className="font-semibold text-text-primary mt-0.5">{selectedClaim.medicine?.name || 'Medicine'}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Generic Name</span>
                    <p className="font-semibold text-text-primary mt-0.5">{selectedClaim.medicine?.genericName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Dosage & Strength</span>
                    <p className="font-medium text-text-primary mt-0.5">
                      {[selectedClaim.medicine?.dosageForm, selectedClaim.medicine?.strength].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-muted">Requested Quantity</span>
                    <p className="font-semibold text-primary mt-0.5">{selectedClaim.requestedQuantity} units</p>
                  </div>
                  {selectedClaim.listing?.expiryDate && (
                    <div>
                      <span className="text-text-muted">Expiry Date</span>
                      <p className="font-medium text-text-primary mt-0.5">{formatDate(selectedClaim.listing.expiryDate)}</p>
                    </div>
                  )}
                  {selectedClaim.listing?.batchNumber && (
                    <div>
                      <span className="text-text-muted">Batch Number</span>
                      <p className="font-mono text-text-primary mt-0.5">{selectedClaim.listing.batchNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Donor Contact Details */}
              {(selectedClaim.status === 'CONFIRMED' || selectedClaim.status === 'COMPLETED') ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Donor Contact Information
                  </h4>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-primary" />
                        <span className="text-sm font-semibold text-text-primary">
                          {selectedClaim.donor?.name || selectedClaim.listing?.donor?.name || 'Verified Donor'}
                        </span>
                      </div>
                      <span className="text-[11px] rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-500">
                        Verified Donor
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-emerald-500/10 text-xs">
                      {(selectedClaim.donor?.email || selectedClaim.listing?.donor?.email) && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-text-secondary flex items-center gap-1.5">
                            <Mail className="size-3.5 text-text-muted" />
                            {selectedClaim.donor?.email || selectedClaim.listing?.donor?.email}
                          </span>
                          <a
                            href={`mailto:${selectedClaim.donor?.email || selectedClaim.listing?.donor?.email}?subject=MedBridge Medicine Pickup`}
                            className="text-primary hover:underline font-medium"
                          >
                            Send Email
                          </a>
                        </div>
                      )}

                      {(selectedClaim.donor?.phone || selectedClaim.listing?.donor?.phone) && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-text-secondary flex items-center gap-1.5">
                            <Phone className="size-3.5 text-text-muted" />
                            {selectedClaim.donor?.phone || selectedClaim.listing?.donor?.phone}
                          </span>
                          <a
                            href={`tel:${selectedClaim.donor?.phone || selectedClaim.listing?.donor?.phone}`}
                            className="text-emerald-500 hover:underline font-medium"
                          >
                            Call Now
                          </a>
                        </div>
                      )}

                      {(selectedClaim.pickupAddress || selectedClaim.listing?.pickupAddress || selectedClaim.donor?.address) && (
                        <div className="pt-2 border-t border-emerald-500/10">
                          <span className="text-text-muted block mb-0.5">Pickup Location</span>
                          <p className="text-text-primary flex items-start gap-1.5">
                            <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                            {[
                              selectedClaim.pickupAddress || selectedClaim.listing?.pickupAddress || selectedClaim.donor?.address,
                              selectedClaim.pickupCity || selectedClaim.listing?.city || selectedClaim.donor?.city,
                              selectedClaim.pickupState || selectedClaim.listing?.state || selectedClaim.donor?.state,
                              selectedClaim.pickupPincode || selectedClaim.listing?.pincode || selectedClaim.donor?.pincode,
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-background p-4 text-xs text-text-secondary flex items-start gap-2.5">
                  <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-text-primary">Donor Contact Hidden</p>
                    <p className="mt-0.5">
                      To protect user privacy, donor contact details and exact pickup address are released immediately once the donor accepts and confirms this claim request.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5 bg-background/50">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-background"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
