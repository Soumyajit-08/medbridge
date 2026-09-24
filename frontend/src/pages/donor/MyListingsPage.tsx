import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useMyListings, useDeleteListing } from '@/hooks/useListings';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/utils/formatDate';

export function MyListingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useMyListings({ page });
  const deleteListing = useDeleteListing();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      deleteListing.mutate(id);
    }
  };

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
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[560px] text-left text-sm">
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
                    {listing.medicine?.name ?? 'Medicine'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{listing.quantityAvailable}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(listing.expiryDate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={ROUTES.donor.listingDetails(listing.id)}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      {(listing.status === 'ACTIVE' || listing.status === 'CLAIM_PENDING') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger/10 hover:text-danger p-1.5 h-auto"
                          title="Delete listing"
                          disabled={deleteListing.isPending}
                          onClick={() => handleDelete(listing.id)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
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
