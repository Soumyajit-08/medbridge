import { CheckCircle2 } from 'lucide-react';
import { ELIGIBILITY_MESSAGE } from '@/lib/constants';
import { cn } from '@/utils/cn';

export interface EligibilityResultProps {
  passed?: boolean;
  className?: string;
}

export function EligibilityResult({ passed = true, className }: EligibilityResultProps) {
  if (!passed) {
    return (
      <div
        className={cn(
          'rounded-lg border border-critical/20 bg-critical/5 p-4 text-sm text-critical',
          className,
        )}
        role="alert"
      >
        This listing did not pass preliminary eligibility screening. Please review safety
        requirements before proceeding.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-secondary/20 bg-secondary/5 p-4',
        className,
      )}
      role="status"
    >
      <CheckCircle2 className="size-5 shrink-0 text-secondary" aria-hidden="true" />
      <p className="text-sm text-text-primary">{ELIGIBILITY_MESSAGE}</p>
    </div>
  );
}
