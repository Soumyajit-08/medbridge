import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { ClaimStatus } from '@/types/claim';
import { cn } from '@/utils/cn';

const timelineSteps: { status: ClaimStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'COMPLETED', label: 'Completed' },
];

export interface ClaimTimelineProps {
  status: ClaimStatus;
  className?: string;
}

function getStepState(
  stepStatus: ClaimStatus,
  currentStatus: ClaimStatus,
): 'completed' | 'current' | 'upcoming' | 'cancelled' {
  if (currentStatus === 'CANCELLED') {
    if (stepStatus === 'PENDING') return 'completed';
    return 'cancelled';
  }

  const order: ClaimStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED'];
  const currentIndex = order.indexOf(currentStatus);
  const stepIndex = order.indexOf(stepStatus);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

export function ClaimTimeline({ status, className }: ClaimTimelineProps) {
  const isCancelled = status === 'CANCELLED';

  return (
    <div className={cn('space-y-2', className)}>
      {isCancelled && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
          <XCircle className="size-5 shrink-0 text-critical" aria-hidden="true" />
          <div>
            <p className="font-medium text-critical">Cancelled</p>
            <p className="text-sm text-text-secondary">This claim was cancelled.</p>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-0 sm:flex-row sm:items-center sm:gap-2" aria-label="Claim progress">
        {timelineSteps.map((step, index) => {
          const state = getStepState(step.status, status);
          const isLast = index === timelineSteps.length - 1;

          return (
            <li key={step.status} className="flex items-center gap-2 sm:flex-1">
              <div className="flex items-center gap-2">
                {state === 'completed' && (
                  <CheckCircle2 className="size-5 shrink-0 text-secondary" aria-hidden="true" />
                )}
                {state === 'current' && (
                  <Circle className="size-5 shrink-0 fill-primary text-primary" aria-hidden="true" />
                )}
                {state === 'upcoming' && (
                  <Circle className="size-5 shrink-0 text-border" aria-hidden="true" />
                )}
                {state === 'cancelled' && (
                  <XCircle className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    state === 'current' && 'text-primary',
                    state === 'completed' && 'text-secondary',
                    state === 'upcoming' && 'text-text-secondary',
                    state === 'cancelled' && 'text-text-secondary',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'hidden h-0.5 flex-1 sm:block',
                    state === 'completed' ? 'bg-secondary' : 'bg-border',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
