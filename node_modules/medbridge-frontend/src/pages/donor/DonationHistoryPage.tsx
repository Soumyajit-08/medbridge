import { useClaims } from '@/hooks/useClaims';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ClaimCard } from '@/components/claims/ClaimCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { History } from 'lucide-react';

export function DonationHistoryPage() {
  const { data, isLoading } = useClaims({ status: 'COMPLETED' });

  return (
    <>
      <PageHeader title="Donation History" subtitle="Completed medicine transfers" />
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : !data?.data.length ? (
        <EmptyState icon={History} title="No completed transfers" description="Completed donations will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </>
  );
}
