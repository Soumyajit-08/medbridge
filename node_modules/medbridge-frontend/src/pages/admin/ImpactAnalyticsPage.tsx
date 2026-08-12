import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { QueryState } from '@/components/dashboard/QueryState';
import { useImpactAnalytics } from '@/hooks/useAdmin';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Package, Recycle, ShieldCheck, Timer } from 'lucide-react';

export function ImpactAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useImpactAnalytics();

  const chartData = data
    ? [
        { name: 'Completed', value: data.completedTransfers },
        { name: 'Expired', value: data.expiredListings },
        { name: 'Active', value: data.activeListings },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Impact analytics"
        subtitle="Platform-wide medicine redistribution metrics"
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsGrid>
          <StatCard
            label="Completed transfers"
            value={data?.completedTransfers ?? 0}
            icon={Package}
          />
          <StatCard
            label="Waste prevention rate"
            value={`${data?.wastePreventionRate ?? 0}%`}
            icon={Recycle}
          />
          <StatCard
            label="Verified organizations"
            value={data?.verifiedOrganizations ?? 0}
            icon={ShieldCheck}
          />
          <StatCard
            label="Avg. time to claim"
            value={`${data?.averageTimeToClaimHours ?? 0}h`}
            icon={Timer}
          />
        </StatsGrid>

        <DashboardSection title="Listing outcomes" className="mt-8">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E7" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0F6E6A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardSection>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total listings', data?.totalListings],
            ['Claimed quantities', data?.claimedQuantities],
            ['Expired quantities', data?.expiredQuantities],
            ['Avg. completion time', `${data?.averageCompletionTimeHours ?? 0}h`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                {label}
              </dt>
              <dd className="mt-1 text-2xl font-bold text-text-primary">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </QueryState>
    </>
  );
}
