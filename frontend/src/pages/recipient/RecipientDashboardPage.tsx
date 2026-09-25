import { Link } from 'react-router-dom';
import { ClipboardList, Heart, Package, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { QueryState } from '@/components/dashboard/QueryState';
import { useRecipientDashboard } from '@/hooks/useDashboard';
import { useClaims } from '@/hooks/useClaims';
import { ROUTES } from '@/lib/constants';
import { StatusBadge } from '@/components/common/StatusBadge';

export function RecipientDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useRecipientDashboard();
  const { data: activeClaims } = useClaims({ status: 'CONFIRMED' });

  return (
    <>
      <PageHeader
        title="Recipient Dashboard"
        subtitle="Browse surplus medicines and manage your claims"
        actions={
          <Link to={ROUTES.recipient.medicines}>
            <Button size="sm">
              <Search className="size-4" aria-hidden="true" />
              Browse medicines
            </Button>
          </Link>
        }
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsGrid>
          <StatCard
            label="Available matches"
            value={stats?.availableMatches ?? 0}
            icon={Package}
            href={ROUTES.recipient.medicines}
          />
          <StatCard
            label="Active claims"
            value={stats?.activeClaims ?? 0}
            icon={ClipboardList}
            href={ROUTES.recipient.claims}
          />
          <StatCard
            label="Pending needs"
            value={stats?.pendingNeeds ?? 0}
            icon={Heart}
            href={ROUTES.recipient.needs}
          />
          <StatCard
            label="Completed transfers"
            value={stats?.completedTransfers ?? 0}
            icon={Package}
            href={ROUTES.recipient.claims}
          />
        </StatsGrid>

        <DashboardSection
          title="Active claims"
          className="mt-8"
          action={
            <Link to={ROUTES.recipient.claims}>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          }
        >
          {!activeClaims?.data.length ? (
            <p className="text-sm text-text-secondary">No active claims.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activeClaims.data.slice(0, 5).map((claim) => (
                <li key={claim.id} className="flex items-center justify-between py-3 first:pt-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{claim.medicine?.name || 'Medicine'}</p>
                    <p className="text-xs text-text-secondary">Qty {claim.requestedQuantity}</p>
                  </div>
                  <StatusBadge status={claim.status} />
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </QueryState>
    </>
  );
}
