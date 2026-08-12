import { Link } from 'react-router-dom';
import { ClipboardList, History, Package, PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { QueryState } from '@/components/dashboard/QueryState';
import { useDonorDashboard } from '@/hooks/useDashboard';
import { useClaims } from '@/hooks/useClaims';
import { useMyListings } from '@/hooks/useListings';
import { ROUTES } from '@/lib/constants';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatRelativeTime } from '@/utils/formatDate';

export function DonorDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDonorDashboard();
  const { data: recentListings } = useMyListings({ limit: 5 });
  const { data: pendingClaims } = useClaims({ status: 'PENDING' });

  return (
    <>
      <PageHeader
        title="Donor Dashboard"
        subtitle="Manage your surplus medicine listings and claim requests"
        actions={
          <Link to={ROUTES.donor.createListing}>
            <Button size="sm">
              <PlusCircle className="size-4" aria-hidden="true" />
              New listing
            </Button>
          </Link>
        }
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsGrid>
          <StatCard label="Total listings" value={stats?.totalListings ?? 0} icon={Package} />
          <StatCard label="Active listings" value={stats?.activeListings ?? 0} icon={Package} />
          <StatCard
            label="Pending claims"
            value={stats?.pendingClaims ?? 0}
            icon={ClipboardList}
          />
          <StatCard
            label="Completed transfers"
            value={stats?.completedTransfers ?? 0}
            icon={History}
          />
        </StatsGrid>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <DashboardSection
            title="Recent listings"
            action={
              <Link to={ROUTES.donor.listings}>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            }
          >
            {!recentListings?.data.length ? (
              <p className="text-sm text-text-secondary">No listings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentListings.data.map((listing) => (
                  <li key={listing.id} className="flex items-center justify-between py-3 first:pt-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {listing.medicine.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatRelativeTime(listing.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={listing.status} />
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          <DashboardSection
            title="Pending claim requests"
            action={
              <Link to={ROUTES.donor.claims}>
                <Button variant="ghost" size="sm">
                  Review all
                </Button>
              </Link>
            }
          >
            {!pendingClaims?.data.length ? (
              <p className="text-sm text-text-secondary">No pending claims.</p>
            ) : (
              <ul className="divide-y divide-border">
                {pendingClaims.data.slice(0, 5).map((claim) => (
                  <li key={claim.id} className="py-3 first:pt-0">
                    <p className="text-sm font-medium text-text-primary">
                      {claim.medicine.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {claim.recipientOrganization} · Qty {claim.requestedQuantity}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>
        </div>
      </QueryState>
    </>
  );
}
