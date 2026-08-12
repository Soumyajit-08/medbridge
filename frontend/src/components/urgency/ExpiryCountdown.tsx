import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDate, getDaysRemaining } from '@/utils/formatDate';
import type { UrgencyLevel } from '@/types/listing';

export interface ExpiryCountdownProps {
  expiryDate: string;
  daysRemaining?: number;
  className?: string;
}

function getUrgencyFromDays(days: number): UrgencyLevel {
  if (days <= 0) return 'EXPIRED';
  if (days <= 3) return 'CRITICAL';
  if (days <= 7) return 'HIGH';
  if (days <= 30) return 'MEDIUM';
  return 'LOW';
}

const urgencyTextColors: Record<UrgencyLevel, string> = {
  LOW: 'text-secondary',
  MEDIUM: 'text-yellow-700',
  HIGH: 'text-accent',
  CRITICAL: 'text-critical',
  EXPIRED: 'text-text-secondary',
};

export function ExpiryCountdown({ expiryDate, daysRemaining, className }: ExpiryCountdownProps) {
  const days = daysRemaining ?? getDaysRemaining(expiryDate);
  const urgency = getUrgencyFromDays(days);

  const label =
    days <= 0
      ? 'Expired'
      : days === 1
        ? '1 day remaining'
        : `${days} days remaining`;

  return (
    <div
      className={cn('flex items-center gap-1.5 text-sm', urgencyTextColors[urgency], className)}
      title={`Expires ${formatDate(expiryDate)}`}
    >
      <Clock className="size-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
