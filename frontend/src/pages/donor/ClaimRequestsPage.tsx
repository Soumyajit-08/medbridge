import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import {
  useClaims,
  useConfirmClaim,
  useRejectClaim,
  useCompleteClaim,
} from '@/hooks/useClaims';
import { formatDateTime, formatRelativeTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import type { Claim } from '@/types/claim';

const getRecipientDetails = (claim: any) => {
  const r = claim?.recipient || {};
  const repName = r.name || claim?.recipientName || 'Authorized Representative';
  const email = r.email || r.emailAddress || claim?.recipientEmail || claim?.email || '';
  const phone = r.phone || r.phoneNumber || r.mobile || claim?.recipientPhone || claim?.phone || '';

  return { repName, email, phone };
};

export function ClaimRequestsPage() {
  const [searchParams] = useSearchParams();
  const highlightClaimId = searchParams.get('claimId');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useClaims({ page });
  const confirmClaim = useConfirmClaim();
  const rejectClaim = useRejectClaim();
  const completeClaim = useCompleteClaim();
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Automatically select claim if claimId is passed in URL from notifications
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
        title="Claim requests"
        subtitle="Review, confirm and coordinate medicine handover with verified recipients"
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No claim requests"
        emptyDescription="When verified clinics or NGOs request your medicine listings, they will appear here."
      >
        <div className="space-y-4">
          {data?.data.map((claim) => {
            const isConfirmed = claim.status === 'CONFIRMED' || claim.status === 'COMPLETED';
            const recipient = claim.recipient;
            const recipientOrg =
              claim.recipientOrganization ||
              recipient?.organizationName ||
              recipient?.name ||
              'Recipient Organization';
            const recipientLocation = [
              recipient?.address,
              recipient?.city,
              recipient?.state,
              recipient?.pincode,
            ]
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
                  {/* Medicine & Recipient Summary */}
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
                      <span className="font-medium text-text-primary">{recipientOrg}</span>
                      <span> · Requested {claim.requestedQuantity} units</span>
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

                {/* Confirmed Recipient Contact Card */}
                {isConfirmed && (() => {
                  const recipientDetails = getRecipientDetails(claim);
                  return (
                    <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-primary" />
                          <span className="text-xs font-semibold text-text-primary">
                            Recipient Contact & Delivery Details
                          </span>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                            Verified Organization
                          </span>
                        </div>
                        {recipient?.organizationType && (
                          <span className="text-[11px] font-medium text-text-muted uppercase">
                            {recipient.organizationType}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-3.5 sm:grid-cols-2">
                        <div className="space-y-2 text-xs">
                          <p className="font-semibold text-text-primary flex items-center gap-1.5 text-sm">
                            <User className="size-4 text-primary shrink-0" />
                            <span className="text-text-muted font-normal">Representative:</span>
                            <span>{recipientDetails.repName}</span>
                          </p>

                          <p className="text-text-secondary flex items-center gap-1.5">
                            <Phone className="size-3.5 text-emerald-500 shrink-0" />
                            <span className="text-text-muted font-medium">Mobile / Phone:</span>
                            <a href={`tel:${recipientDetails.phone}`} className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                              {recipientDetails.phone}
                            </a>
                          </p>

                          <p className="text-text-secondary flex items-center gap-1.5">
                            <Mail className="size-3.5 text-primary shrink-0" />
                            <span className="text-text-muted font-medium">Email:</span>
                            <a href={`mailto:${recipientDetails.email}?subject=MedBridge Handover`} className="font-medium text-primary hover:underline">
                              {recipientDetails.email}
                            </a>
                          </p>

                          {recipientLocation && (
                            <p className="text-text-secondary flex items-start gap-1.5 pt-0.5">
                              <MapPin className="size-3.5 text-text-muted shrink-0 mt-0.5" />
                              <span><span className="text-text-muted font-medium">Location:</span> {recipientLocation}</span>
                            </p>
                          )}
                        </div>

                        {/* Contact Channels */}
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:self-center">
                          <a
                            href={`mailto:${recipientDetails.email}?subject=MedBridge Handover: ${claim.medicine?.name || 'Medicine'}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                          >
                            <Mail className="size-3.5" /> Send Email
                          </a>
                          <a
                            href={`tel:${recipientDetails.phone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95 cursor-pointer"
                          >
                            <Phone className="size-3.5 text-emerald-500" /> Call Now
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Pending Confirmation Actions */}
                {claim.status === 'PENDING' && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs text-text-muted">
                      Confirming will unlock direct contact details between you and {recipientOrg}.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        isLoading={confirmClaim.isPending}
                        onClick={() => confirmClaim.mutate(claim.id)}
                      >
                        Confirm claim
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={rejectClaim.isPending}
                        onClick={() => rejectClaim.mutate(claim.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

                {/* Complete Handover Action for Confirmed Claim */}
                {claim.status === 'CONFIRMED' && (
                  <div className="mt-3 flex items-center justify-between border-t border-emerald-500/10 pt-3">
                    <span className="text-xs text-text-muted">
                      Handover coordinated? Finalize this donation:
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      isLoading={completeClaim.isPending}
                      onClick={() => completeClaim.mutate(claim.id)}
                    >
                      Mark handover completed
                    </Button>
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
                <h3 className="text-base font-semibold text-text-primary">Claim Request Details</h3>
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
                  <p className="text-xs text-text-muted">Claim Status</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">
                    {selectedClaim.status === 'CONFIRMED'
                      ? 'Confirmed & Ready for Handover'
                      : selectedClaim.status === 'PENDING'
                      ? 'Awaiting Your Confirmation'
                      : selectedClaim.status === 'COMPLETED'
                      ? 'Handover Completed'
                      : 'Cancelled'}
                  </p>
                </div>
                <StatusBadge status={selectedClaim.status} />
              </div>

              {/* Recipient Information */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Recipient Organization
                </h4>
                <div className="rounded-xl border border-border p-4 text-xs bg-surface space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-text-primary">
                      {selectedClaim.recipientOrganization || selectedClaim.recipient?.organizationName || 'Recipient Organization'}
                    </span>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-500">
                      Verified Organization
                    </span>
                  </div>

                  {selectedClaim.status === 'CONFIRMED' || selectedClaim.status === 'COMPLETED' ? (() => {
                    const recipientDetails = getRecipientDetails(selectedClaim);
                    return (
                      <div className="pt-2.5 border-t border-border space-y-2.5">
                        <p className="text-text-secondary flex items-center gap-1.5 font-medium">
                          <User className="size-3.5 text-primary shrink-0" />
                          <span className="text-text-muted">Representative:</span>
                          <span className="font-semibold text-text-primary">{recipientDetails.repName}</span>
                        </p>

                        {/* Recipient Mobile / Phone Number */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-text-secondary flex items-center gap-1.5">
                            <Phone className="size-3.5 text-emerald-500 shrink-0" />
                            <span className="text-text-muted font-medium">Mobile / Phone:</span>
                            <a
                              href={`tel:${recipientDetails.phone}`}
                              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              {recipientDetails.phone}
                            </a>
                          </span>
                          <a
                            href={`tel:${recipientDetails.phone}`}
                            className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0"
                          >
                            Call
                          </a>
                        </div>

                        {/* Recipient Email Address */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-text-secondary flex items-center gap-1.5 truncate">
                            <Mail className="size-3.5 text-primary shrink-0" />
                            <span className="text-text-muted font-medium">Email:</span>
                            <a
                              href={`mailto:${recipientDetails.email}?subject=MedBridge Handover: ${selectedClaim.medicine?.name || 'Medicine'}`}
                              className="font-bold text-primary hover:underline truncate"
                            >
                              {recipientDetails.email}
                            </a>
                          </span>
                          <a
                            href={`mailto:${recipientDetails.email}?subject=MedBridge Handover: ${selectedClaim.medicine?.name || 'Medicine'}`}
                            className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
                          >
                            Email
                          </a>
                        </div>
                      </div>
                    );
                  })() : (
                    <p className="pt-2 border-t border-border text-text-muted">
                      Direct contact channels will be displayed here once you confirm this claim.
                    </p>
                  )}
                </div>
              </div>

              {/* Medicine Information */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Medicine & Quantity Requested
                </h4>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 text-xs bg-surface">
                  <div>
                    <span className="text-text-muted">Medicine</span>
                    <p className="font-semibold text-text-primary mt-0.5">{selectedClaim.medicine?.name || 'Medicine'}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Requested Quantity</span>
                    <p className="font-semibold text-primary mt-0.5">{selectedClaim.requestedQuantity} units</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Generic Name</span>
                    <p className="font-medium text-text-primary mt-0.5">{selectedClaim.medicine?.genericName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Requested At</span>
                    <p className="font-medium text-text-primary mt-0.5">{formatDateTime(selectedClaim.createdAt)}</p>
                  </div>
                </div>
              </div>
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
