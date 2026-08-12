import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useMyListings } from '@/hooks/useListings';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/utils/formatDate';

export function MyListingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useMyListings({ page });

  return (
    <>
      <PageHeader
        title="My Listings"
        subtitle="Manage your surplus medicine listings"
        actions={
          <Link to={ROUTES.donor.createListing}>
            <Button size="sm">
              <PlusCircle className="size-4" aria-hidden="true" />
              New listing
            </Button>
          </Link>
        }
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No listings yet"
        emptyDescription="Create your first listing to share surplus medicines."
        emptyAction={
          <Link to={ROUTES.donor.createListing}>
            <Button>Create listing</Button>
          </Link>
        }
      >
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Medicine</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {listing.medicine.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{listing.quantityAvailable}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(listing.expiryDate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={ROUTES.donor.listingDetails(listing.id)}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <Pagination
            className="mt-6"
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </QueryState>
    </>
  );
}
