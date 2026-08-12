import { useState } from 'react';
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
import { formatRelativeTime } from '@/utils/formatDate';

export function ClaimRequestsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useClaims({ page });
  const confirmClaim = useConfirmClaim();
  const rejectClaim = useRejectClaim();
  const completeClaim = useCompleteClaim();

  return (
    <>
      <PageHeader
        title="Claim requests"
        subtitle="Review and respond to recipient claim requests"
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No claim requests"
        emptyDescription="When recipients claim your listings, they'll appear here."
      >
        <div className="space-y-4">
          {data?.data.map((claim) => (
            <article
              key={claim.id}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">{claim.medicine.name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {claim.recipientOrganization} · Qty {claim.requestedQuantity}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {formatRelativeTime(claim.createdAt)}
                  </p>
                </div>
                <StatusBadge status={claim.status} />
              </div>

              {claim.status === 'PENDING' && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    isLoading={confirmClaim.isPending}
                    onClick={() => confirmClaim.mutate(claim.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={rejectClaim.isPending}
                    onClick={() => rejectClaim.mutate(claim.id)}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {claim.status === 'CONFIRMED' && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={completeClaim.isPending}
                    onClick={() => completeClaim.mutate(claim.id)}
                  >
                    Mark completed
                  </Button>
                </div>
              )}
            </article>
          ))}
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
    </>
  );
}
