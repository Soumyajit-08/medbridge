import { Link } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  FileCheck,
  Flag,
  Package,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { QueryState } from '@/components/dashboard/QueryState';
import { useAdminDashboard } from '@/hooks/useAdmin';
import { ROUTES } from '@/lib/constants';

export function AdminDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useAdminDashboard();

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview and moderation tools"
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsGrid>
          <StatCard label="Total users" value={stats?.totalUsers ?? 0} icon={Users} />
          <StatCard
            label="Pending verifications"
            value={stats?.pendingVerifications ?? 0}
            icon={FileCheck}
          />
          <StatCard label="Active listings" value={stats?.activeListings ?? 0} icon={Package} />
          <StatCard label="Pending claims" value={stats?.pendingClaims ?? 0} icon={ClipboardList} />
        </StatsGrid>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Verification queue', href: ROUTES.admin.verifications, icon: FileCheck },
            { label: 'Reports', href: ROUTES.admin.reports, icon: Flag },
            { label: 'Users', href: ROUTES.admin.users, icon: Users },
            { label: 'Impact analytics', href: ROUTES.admin.analytics, icon: BarChart3 },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/30"
            >
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-text-primary">{label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={ROUTES.admin.listings}>
            <Button variant="outline" size="sm">
              Manage listings
            </Button>
          </Link>
          <Link to={ROUTES.admin.auditLogs}>
            <Button variant="outline" size="sm">
              View audit logs
            </Button>
          </Link>
        </div>
      </QueryState>
    </>
  );
}
