import type { ClaimStatus } from '@/types/claim';
import type { ListingStatus, UrgencyLevel } from '@/types/listing';
import type { NeedStatus } from '@/types/need';
import type { VerificationStatus } from '@/types/verification';

export type StatusType =
  | ListingStatus
  | ClaimStatus
  | NeedStatus
  | VerificationStatus
  | 'ACTIVE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLAIMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'OPEN'
  | 'RESOLVED'
  | 'DISMISSED';

export interface StatusConfig {
  label: string;
  className: string;
}

const statusMap: Record<string, StatusConfig> = {
  ACTIVE: { label: 'Active', className: 'bg-secondary/10 text-secondary border-secondary/20' },
  CLAIM_PENDING: { label: 'Claim Pending', className: 'bg-accent/10 text-accent border-accent/20' },
  CLAIMED: { label: 'Claimed', className: 'bg-primary/10 text-primary border-primary/20' },
  COMPLETED: { label: 'Completed', className: 'bg-secondary/10 text-secondary border-secondary/20' },
  REMOVED: { label: 'Removed', className: 'bg-text-secondary/10 text-text-secondary border-border' },
  EXPIRED: { label: 'Expired', className: 'bg-text-secondary/10 text-text-secondary border-border' },
  PENDING: { label: 'Pending', className: 'bg-accent/10 text-accent border-accent/20' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-primary/10 text-primary border-primary/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-text-secondary/10 text-text-secondary border-border' },
  APPROVED: { label: 'Approved', className: 'bg-secondary/10 text-secondary border-secondary/20' },
  REJECTED: { label: 'Rejected', className: 'bg-critical/10 text-critical border-critical/20' },
  MATCHED: { label: 'Matched', className: 'bg-primary/10 text-primary border-primary/20' },
  FULFILLED: { label: 'Fulfilled', className: 'bg-secondary/10 text-secondary border-secondary/20' },
  OPEN: { label: 'Open', className: 'bg-accent/10 text-accent border-accent/20' },
  RESOLVED: { label: 'Resolved', className: 'bg-secondary/10 text-secondary border-secondary/20' },
  DISMISSED: { label: 'Dismissed', className: 'bg-text-secondary/10 text-text-secondary border-border' },
};

export function getStatusConfig(status: StatusType): StatusConfig {
  return statusMap[status] ?? { label: status, className: 'bg-border text-text-secondary border-border' };
}

export interface UrgencyConfig {
  label: string;
  className: string;
  dotClass: string;
}

const urgencyMap: Record<UrgencyLevel, UrgencyConfig> = {
  LOW: { label: 'Low', className: 'bg-secondary/10 text-secondary border-secondary/20', dotClass: 'bg-secondary' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', dotClass: 'bg-yellow-500' },
  HIGH: { label: 'High', className: 'bg-accent/10 text-accent border-accent/20', dotClass: 'bg-accent' },
  CRITICAL: { label: 'Critical', className: 'bg-critical/10 text-critical border-critical/20', dotClass: 'bg-critical' },
  EXPIRED: { label: 'Expired', className: 'bg-text-secondary/10 text-text-secondary border-border', dotClass: 'bg-text-secondary' },
};

export function getUrgencyConfig(urgency: UrgencyLevel): UrgencyConfig {
  return urgencyMap[urgency];
}
