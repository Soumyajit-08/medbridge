import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ApproximateDistance } from './ApproximateDistance';

export interface LocationCardProps {
  city: string;
  state: string;
  postalCode?: string;
  approximateDistanceKm?: number;
  className?: string;
}

export function LocationCard({
  city,
  state,
  postalCode,
  approximateDistanceKm,
  className,
}: LocationCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-background p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MapPin className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text-primary">{city}, {state}</p>
          {postalCode && (
            <p className="text-sm text-text-secondary">{postalCode}</p>
          )}
          {approximateDistanceKm !== undefined && (
            <ApproximateDistance
              distanceKm={approximateDistanceKm}
              className="mt-1"
            />
          )}
        </div>
      </div>
    </div>
  );
}
