import { Link } from 'react-router-dom';
import type { Listing } from '@/types/listing';
import { ROUTES } from '@/lib/constants';
import { ListingStatus } from './ListingStatus';
import { UrgencyBadge } from '@/components/urgency/UrgencyBadge';
import { ExpiryCountdown } from '@/components/urgency/ExpiryCountdown';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

export interface ListingTableProps {
  listings: Listing[];
  className?: string;
  showDonorListingsLink?: boolean;
}

export function ListingTable({
  listings,
  className,
  showDonorListingsLink = false,
}: ListingTableProps) {
  if (listings.length === 0) {
    return (
      <p className="text-sm text-text-secondary">No listings to display.</p>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-background">
          <tr>
            <th className="px-4 py-3 font-medium text-text-secondary">Medicine</th>
            <th className="px-4 py-3 font-medium text-text-secondary">Quantity</th>
            <th className="px-4 py-3 font-medium text-text-secondary">Expiry</th>
            <th className="px-4 py-3 font-medium text-text-secondary">Urgency</th>
            <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
            {showDonorListingsLink && (
              <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {listings.map((listing) => (
            <tr key={listing.id} className="hover:bg-background/50">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{listing.medicine.name}</p>
                <p className="text-xs text-text-secondary">{listing.medicine.genericName}</p>
              </td>
              <td className="px-4 py-3 text-text-primary">{listing.quantityAvailable}</td>
              <td className="px-4 py-3">
                <p className="text-text-primary">{formatDate(listing.expiryDate)}</p>
                <ExpiryCountdown
                  expiryDate={listing.expiryDate}
                  daysRemaining={listing.daysRemaining}
                  className="text-xs"
                />
              </td>
              <td className="px-4 py-3">
                <UrgencyBadge urgency={listing.urgency} />
              </td>
              <td className="px-4 py-3">
                <ListingStatus status={listing.status} />
              </td>
              {showDonorListingsLink && (
                <td className="px-4 py-3">
                  <Link
                    to={ROUTES.donor.listingDetails(listing.id)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
