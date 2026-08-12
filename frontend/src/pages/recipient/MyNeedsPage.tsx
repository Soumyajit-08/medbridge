import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useNeeds } from '@/hooks/useNeeds';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/utils/formatDate';

export function MyNeedsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useNeeds({ page });

  return (
    <>
      <PageHeader
        title="My needs"
        subtitle="Medicine needs you've posted for matching"
        actions={
          <Link to={ROUTES.recipient.createNeed}>
            <Button size="sm">
              <PlusCircle className="size-4" aria-hidden="true" />
              Post need
            </Button>
          </Link>
        }
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No needs posted"
        emptyDescription="Post a medicine need to get matched with available listings."
        emptyAction={
          <Link to={ROUTES.recipient.createNeed}>
            <Button>Post need</Button>
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.data.map((need) => (
            <article
              key={need.id}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-text-primary">{need.medicine.name}</h2>
                <StatusBadge status={need.status} />
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Qty {need.quantityNeeded} · {need.location.city}, {need.location.state}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Expires {formatDate(need.expiresAt)} · {need.matchCount} matches
              </p>
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
