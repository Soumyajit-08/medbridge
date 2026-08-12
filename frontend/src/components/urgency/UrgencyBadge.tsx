import {
  AlertTriangle,
  Ban,
  Circle,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import type { UrgencyLevel } from '@/types/listing';
import { cn } from '@/utils/cn';
import { getUrgencyConfig } from '@/utils/statusHelpers';

const urgencyIcons: Record<UrgencyLevel, LucideIcon> = {
  LOW: Circle,
  MEDIUM: AlertTriangle,
  HIGH: AlertTriangle,
  CRITICAL: Flame,
  EXPIRED: Ban,
};

export interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  className?: string;
  showIcon?: boolean;
}

export function UrgencyBadge({ urgency, className, showIcon = true }: UrgencyBadgeProps) {
  const config = getUrgencyConfig(urgency);
  const Icon = urgencyIcons[urgency];

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
