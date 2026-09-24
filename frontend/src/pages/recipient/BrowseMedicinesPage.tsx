import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useListings } from '@/hooks/useListings';
import { useDebounce } from '@/hooks/useDebounce';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/utils/formatDate';

export function BrowseMedicinesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, isError, refetch } = useListings({
    search: debouncedSearch || undefined,
    page,
  });

  return (
    <>
      <PageHeader
        title="Browse medicines"
        subtitle="Find surplus medicines from verified donors"
      />

      <div className="mb-6 max-w-md">
        <Input
          label="Search"
          icon={Search}
          placeholder="Search by medicine name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No medicines found"
        emptyDescription="Try adjusting your search or check back later."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.data.map((listing) => (
            <article
              key={listing.id}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-text-primary">{listing.medicine?.name ?? 'Medicine'}</h2>
                <StatusBadge status={listing.status} />
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {listing.medicine?.strength ?? ''} · Qty {listing.quantityAvailable}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Expires {formatDate(listing.expiryDate)}{listing.location?.city ? ` · ${listing.location.city}` : ''}
              </p>
              <Link to={ROUTES.recipient.medicineDetails(listing.id)} className="mt-4 block">
                <Button variant="outline" size="sm" className="w-full">
                  View details
                </Button>
              </Link>
            </article>
          ))}
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
