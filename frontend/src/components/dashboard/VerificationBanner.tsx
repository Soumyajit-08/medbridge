import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';

interface VerificationBannerProps {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  className?: string;
}

export function VerificationBanner({ status, className }: VerificationBannerProps) {
  const isRejected = status === 'REJECTED';

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-4 rounded-[var(--radius-card)] border p-4 sm:flex-row sm:items-center sm:justify-between',
        isRejected
          ? 'border-critical/20 bg-critical/5'
          : 'border-accent/20 bg-accent/5',
        className,
      )}
    >
      <div className="flex gap-3">
        {isRejected ? (
          <AlertTriangle className="size-5 shrink-0 text-critical" aria-hidden="true" />
        ) : (
          <ShieldCheck className="size-5 shrink-0 text-accent" aria-hidden="true" />
        )}
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {isRejected ? 'Verification rejected' : 'Verification required'}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {isRejected
              ? 'Your organization verification was rejected. Please resubmit updated documents.'
              : 'Complete organization verification to browse and claim surplus medicines.'}
          </p>
        </div>
      </div>
      <Link to={ROUTES.recipient.verification}>
        <Button size="sm" variant={isRejected ? 'danger' : 'primary'}>
          {isRejected ? 'Resubmit verification' : 'Verify now'}
        </Button>
      </Link>
    </div>
  );
}
