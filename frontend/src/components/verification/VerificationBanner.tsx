import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/utils/cn';
import type { VerificationStatus } from '@/types/verification';

type VerificationStatusType = VerificationStatus;

const bannerConfig: Record<
  VerificationStatusType,
  {
    icon: typeof CheckCircle2;
    title: string;
    message: string;
    className: string;
    showAction?: boolean;
  }
> = {
  PENDING: {
    icon: Clock,
    title: 'Verification Pending',
    message: 'Your organization verification is under review. Some features may be limited.',
    className: 'border-accent/20 bg-accent/5 text-text-primary',
    showAction: false,
  },
  APPROVED: {
    icon: CheckCircle2,
    title: 'Verified Organization',
    message: 'Your organization has been verified. You can claim medicines and access all features.',
    className: 'border-secondary/20 bg-secondary/5 text-text-primary',
    showAction: false,
  },
  REJECTED: {
    icon: XCircle,
    title: 'Verification Rejected',
    message: 'Your verification was rejected. Please resubmit with corrected documents.',
    className: 'border-critical/20 bg-critical/5 text-text-primary',
    showAction: true,
  },
};

export interface VerificationBannerProps {
  status: VerificationStatusType;
  rejectionReason?: string;
  className?: string;
}

export function VerificationBanner({
  status,
  rejectionReason,
  className,
}: VerificationBannerProps) {
  const config = bannerConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start',
        config.className,
        className,
      )}
      role="status"
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{config.title}</p>
        <p className="mt-1 text-sm opacity-90">{config.message}</p>
        {status === 'REJECTED' && rejectionReason && (
          <p className="mt-2 text-sm">
            <span className="font-medium">Reason:</span> {rejectionReason}
          </p>
        )}
      </div>
      {config.showAction && (
        <Link
          to={ROUTES.recipient.verification}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-background"
        >
          Resubmit
        </Link>
      )}
      {status === 'PENDING' && (
        <AlertTriangle className="size-5 shrink-0 text-accent sm:hidden" aria-hidden="true" />
      )}
    </div>
  );
}
