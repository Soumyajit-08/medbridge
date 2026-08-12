import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useClaims } from '@/hooks/useClaims';
import { formatRelativeTime } from '@/utils/formatDate';

export function MyClaimsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useClaims({ page });

  return (
    <>
      <PageHeader title="My claims" subtitle="Track your medicine claim requests" />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No claims yet"
        emptyDescription="Browse medicines and submit a claim request."
      >
        <div className="space-y-4">
          {data?.data.map((claim) => (
            <article
              key={claim.id}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">{claim.medicine.name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Qty {claim.requestedQuantity} · {formatRelativeTime(claim.createdAt)}
                  </p>
                </div>
                <StatusBadge status={claim.status} />
              </div>
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
