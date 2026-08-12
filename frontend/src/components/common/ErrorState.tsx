import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center px-4 py-12 text-center',
        className,
      )}
    >
      <div
        className="mb-4 flex size-14 items-center justify-center rounded-full bg-critical/10 text-critical"
        aria-hidden="true"
      >
        <AlertTriangle className="size-7" />
      </div>

      <h3 className="text-lg font-semibold text-text-primary">Unable to load content</h3>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">{message}</p>

      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
