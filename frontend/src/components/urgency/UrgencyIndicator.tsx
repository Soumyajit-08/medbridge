import type { UrgencyLevel } from '@/types/listing';
import { cn } from '@/utils/cn';
import { getUrgencyConfig } from '@/utils/statusHelpers';

const urgencyLevels: UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export interface UrgencyIndicatorProps {
  urgency: UrgencyLevel;
  className?: string;
}

export function UrgencyIndicator({ urgency, className }: UrgencyIndicatorProps) {
  const config = getUrgencyConfig(urgency);
  const activeIndex =
    urgency === 'EXPIRED' ? -1 : urgencyLevels.indexOf(urgency);

  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`Urgency: ${config.label}`}>
      {urgencyLevels.map((level, index) => (
        <span
          key={level}
          className={cn(
            'h-2 w-6 rounded-full transition-colors',
            index <= activeIndex ? config.dotClass : 'bg-border',
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
