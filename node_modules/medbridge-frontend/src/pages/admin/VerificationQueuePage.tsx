import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useAdminVerifications } from '@/hooks/useAdmin';
import { ROUTES } from '@/lib/constants';
import { formatRelativeTime } from '@/utils/formatDate';

export function VerificationQueuePage() {
  const { data, isLoading, isError, refetch } = useAdminVerifications();

  const pending = data?.filter((v) => v.status === 'PENDING') ?? [];

  return (
    <>
      <PageHeader
        title="Verification queue"
        subtitle="Review recipient organization verification submissions"
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!pending.length}
        emptyTitle="Queue is empty"
        emptyDescription="No pending verification submissions."
      >
        <div className="space-y-4">
          {pending.map((verification) => (
            <article
              key={verification.id}
              className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-semibold text-text-primary">
                  {verification.organizationName}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {verification.organizationType.replace(/_/g, ' ')} ·{' '}
                  {formatRelativeTime(verification.submittedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={verification.status} />
                <Link to={ROUTES.admin.verificationDetails(verification.id)}>
                  <Button size="sm">Review</Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </QueryState>
    </>
  );
}
