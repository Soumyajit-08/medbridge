import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useAdminReports, useResolveReport } from '@/hooks/useAdmin';
import { formatRelativeTime } from '@/utils/formatDate';

export function ReportsPage() {
  const { data, isLoading, isError, refetch } = useAdminReports();
  const resolveReport = useResolveReport();

  return (
    <>
      <PageHeader title="Reports" subtitle="Review flagged listings and user reports" />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.length}
        emptyTitle="No reports"
        emptyDescription="No listing reports to review."
      >
        <div className="space-y-4">
          {data?.map((report) => (
            <article
              key={report.id}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">{report.listingTitle}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{report.reason}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Reported by {report.reporterName} · {formatRelativeTime(report.createdAt)}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              {report.status === 'OPEN' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  isLoading={resolveReport.isPending}
                  onClick={() => resolveReport.mutate(report.id)}
                >
                  Resolve report
                </Button>
              )}
            </article>
          ))}
        </div>
      </QueryState>
    </>
  );
}
