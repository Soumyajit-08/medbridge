import { Link } from 'react-router-dom';
import type { Claim } from '@/types/claim';
import { ROUTES } from '@/lib/constants';
import { MedicineInfoCard } from '@/components/medicines/MedicineInfoCard';
import { ClaimStatus } from './ClaimStatus';
import { formatDate, formatRelativeTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import { Building2, Home, Store } from 'lucide-react';
import type { DonorType } from '@/types/auth';

const donorTypeLabels: Record<DonorType, { label: string; icon: typeof Home }> = {
  HOUSEHOLD: { label: 'Household', icon: Home },
  PHARMACY: { label: 'Pharmacy', icon: Store },
  AUTHORIZED_ORGANIZATION: { label: 'Authorized Org', icon: Building2 },
};

export interface ClaimCardProps {
  claim: Claim;
  className?: string;
  linkTo?: string;
}

export function ClaimCard({ claim, className, linkTo }: ClaimCardProps) {
  const donorConfig = donorTypeLabels[claim.donorType];
  const DonorIcon = donorConfig.icon;
  const href = linkTo ?? ROUTES.recipient.claims;

  return (
    <Link
      to={href}
      className={cn(
        'block rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]',
        'transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <MedicineInfoCard medicine={claim.medicine} compact className="flex-1 border-0 bg-transparent p-0" />
        <ClaimStatus status={claim.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        <span>Qty: {claim.requestedQuantity}</span>
        <span
          className="inline-flex items-center gap-1"
        >
          <DonorIcon className="size-3.5" aria-hidden="true" />
          {donorConfig.label}
        </span>
        <span>{formatRelativeTime(claim.createdAt)}</span>
      </div>

      <p className="mt-2 text-xs text-text-secondary">
        Requested {formatDate(claim.createdAt)}
      </p>
    </Link>
  );
}
