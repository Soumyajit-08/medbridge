import type { UrgencyLevel } from '@/types/listing';
import { cn } from '@/utils/cn';
import { getUrgencyConfig } from '@/utils/statusHelpers';

const urgencyScores: Record<UrgencyLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
  EXPIRED: 0,
};

export interface UrgencyScoreProps {
  urgency: UrgencyLevel;
  className?: string;
  maxScore?: number;
}

export function UrgencyScore({ urgency, className, maxScore = 4 }: UrgencyScoreProps) {
  const config = getUrgencyConfig(urgency);
  const score = urgencyScores[urgency];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: maxScore }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'size-2.5 rounded-full',
              i < score ? config.dotClass : 'bg-border',
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-text-secondary">{config.label}</span>
    </div>
  );
}
