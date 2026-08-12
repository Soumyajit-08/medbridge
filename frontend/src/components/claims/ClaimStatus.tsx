import type { ClaimStatus } from '@/types/claim';
import { StatusBadge } from '@/components/common/StatusBadge';

export interface ClaimStatusProps {
  status: ClaimStatus;
  className?: string;
}

export function ClaimStatus({ status, className }: ClaimStatusProps) {
  return <StatusBadge status={status} className={className} />;
}
