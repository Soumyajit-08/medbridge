import type { Listing } from '@/types/listing';
import { ListingCard } from './ListingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { cn } from '@/utils/cn';

export interface ListingGridProps {
  listings: Listing[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  columns?: 2 | 3 | 4;
}

const columnStyles = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function ListingGrid({
  listings,
  isLoading = false,
  emptyTitle = 'No listings found',
  emptyDescription = 'Try adjusting your filters or check back later.',
  className,
  columns = 3,
}: ListingGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-4', columnStyles[columns], className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className={cn('grid gap-4', columnStyles[columns], className)}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
