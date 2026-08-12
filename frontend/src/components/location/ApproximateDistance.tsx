import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistance } from '@/utils/formatDistance';

export interface ApproximateDistanceProps {
  distanceKm?: number;
  className?: string;
}

export function ApproximateDistance({ distanceKm, className }: ApproximateDistanceProps) {
  return (
    <p className={cn('flex items-center gap-1.5 text-sm text-text-secondary', className)}>
      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
      {formatDistance(distanceKm)}
    </p>
  );
}
