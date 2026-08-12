import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistance } from '@/utils/formatDistance';

export interface DistanceBadgeProps {
  distanceKm?: number;
  className?: string;
}

export function DistanceBadge({ distanceKm, className }: DistanceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-text-secondary',
        className,
      )}
    >
      <MapPin className="size-3 shrink-0" aria-hidden="true" />
      {formatDistance(distanceKm)}
    </span>
  );
}
