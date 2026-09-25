import type { Need } from '@/types/need';
import type { Listing } from '@/types/listing';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';

export interface MatchingResultsProps {
  need: Need;
  matches: Listing[];
  isLoading?: boolean;
  className?: string;
}

export function MatchingResults({
  need,
  matches,
  isLoading = false,
  className,
}: MatchingResultsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-text-primary">
          Matching Listings
        </h3>
        <p className="text-sm text-text-secondary">
          {matches.length} listing{matches.length !== 1 ? 's' : ''} match your need for{' '}
          {need.medicine?.name || 'this medicine'}
        </p>
      </div>

      {matches.length === 0 && !isLoading ? (
        <EmptyState
          title="No matches yet"
          description="We'll notify you when matching listings become available."
        />
      ) : (
        <ListingGrid
          listings={matches}
          isLoading={isLoading}
          emptyTitle="No matches found"
        />
      )}
    </div>
  );
}
