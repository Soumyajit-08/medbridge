import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useAdminListings } from '@/hooks/useAdmin';
import { formatDate } from '@/utils/formatDate';

export function ListingsPage() {
  const { data, isLoading, isError, refetch } = useAdminListings();
  const [page, setPage] = useState(1);

  return (
    <>
      <PageHeader title="Listings" subtitle="All platform medicine listings" />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No listings"
        emptyDescription="No listings on the platform."
      >
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Medicine</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {listing.medicine.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{listing.donorName}</td>
                  <td className="px-4 py-3 text-text-secondary">{listing.quantityAvailable}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(listing.expiryDate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <Pagination
            className="mt-6"
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </QueryState>
    </>
  );
}
