import {
  Ban,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { getStatusConfig, type StatusType } from '@/utils/statusHelpers';

const statusIcons: Partial<Record<StatusType, LucideIcon>> = {
  ACTIVE: CheckCircle2,
  CLAIM_PENDING: Clock,
  CLAIMED: Loader2,
  COMPLETED: CheckCircle2,
  REMOVED: Ban,
  EXPIRED: XCircle,
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  CANCELLED: XCircle,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  MATCHED: CheckCircle2,
  FULFILLED: CheckCircle2,
  OPEN: HelpCircle,
  RESOLVED: CheckCircle2,
  DISMISSED: Ban,
};

export interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = statusIcons[status] ?? HelpCircle;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {showIcon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {config.label}
    </span>
  );
}
