import { Link } from 'react-router-dom';
import type { Need } from '@/types/need';
import { ROUTES } from '@/lib/constants';
import { MedicineInfoCard } from '@/components/medicines/MedicineInfoCard';
import { UrgencyBadge } from '@/components/urgency/UrgencyBadge';
import { NeedStatus } from './NeedStatus';
import { formatDate, formatRelativeTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import { MapPin, Users } from 'lucide-react';

export interface NeedCardProps {
  need: Need;
  className?: string;
}

export function NeedCard({ need, className }: NeedCardProps) {
  return (
    <Link
      to={ROUTES.recipient.needs}
      className={cn(
        'group block rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]',
        'transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40 active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <MedicineInfoCard medicine={need.medicine} compact className="flex-1 border-0 bg-transparent p-0" />
        <NeedStatus status={need.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        <span>Qty needed: {need.quantityNeeded}</span>
        <UrgencyBadge urgency={need.urgency} />
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" aria-hidden="true" />
          {need.matchCount} matches
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden="true" />
          {[need.location?.city, need.location?.state].filter(Boolean).join(', ') || '—'}
        </span>
        <span>Expires {formatDate(need.expiresAt)}</span>
        <span>{formatRelativeTime(need.createdAt)}</span>
      </div>

      {need.description && (
        <p className="mt-3 text-sm text-text-secondary line-clamp-2">{need.description}</p>
      )}
    </Link>
  );
}
