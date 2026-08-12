import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useAdminUsers } from '@/hooks/useAdmin';
import { getRoleLabel } from '@/utils/roleHelpers';
import { formatDate } from '@/utils/formatDate';

export function UsersPage() {
  const { data, isLoading, isError, refetch } = useAdminUsers();

  return (
    <>
      <PageHeader title="Users" subtitle="Platform user accounts" />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.length}
        emptyTitle="No users"
        emptyDescription="No user accounts found."
      >
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">{user.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3 text-text-secondary">{getRoleLabel(user.role)}</td>
                  <td className="px-4 py-3">
                    {user.verificationStatus ? (
                      <StatusBadge status={user.verificationStatus} />
                    ) : (
                      <span className="text-text-secondary">{user.isActive ? 'Active' : 'Inactive'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </>
  );
}
