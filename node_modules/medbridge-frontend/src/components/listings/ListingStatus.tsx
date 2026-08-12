import type { ListingStatus } from '@/types/listing';
import { StatusBadge } from '@/components/common/StatusBadge';

export interface ListingStatusProps {
  status: ListingStatus;
  className?: string;
}

export function ListingStatus({ status, className }: ListingStatusProps) {
  return <StatusBadge status={status} className={className} />;
}
