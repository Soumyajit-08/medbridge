import type { VerificationStatus } from '@/types/verification';
import { StatusBadge } from '@/components/common/StatusBadge';

export interface VerificationStatusProps {
  status: VerificationStatus;
  className?: string;
}

export function VerificationStatus({ status, className }: VerificationStatusProps) {
  return <StatusBadge status={status} className={className} />;
}
