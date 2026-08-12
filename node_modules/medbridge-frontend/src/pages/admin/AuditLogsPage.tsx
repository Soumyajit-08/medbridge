import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { QueryState } from '@/components/dashboard/QueryState';
import { useAdminAuditLogs } from '@/hooks/useAdmin';
import { formatDateTime } from '@/utils/formatDate';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useAdminAuditLogs({ page });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <>
      <PageHeader title="Audit logs" subtitle="Platform activity and security events" />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No audit logs"
        emptyDescription="No events recorded yet."
      >
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-mono text-xs text-text-primary">{log.event}</td>
                  <td className="px-4 py-3 text-text-secondary">{log.userName}</td>
                  <td className="px-4 py-3 text-text-secondary">{log.resource}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {log.ipAddress ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            className="mt-6"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </QueryState>
    </>
  );
}
