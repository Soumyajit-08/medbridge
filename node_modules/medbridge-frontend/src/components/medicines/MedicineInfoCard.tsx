import { Package } from 'lucide-react';
import type { Medicine } from '@/types/medicine';
import { cn } from '@/utils/cn';

export interface MedicineInfoCardProps {
  medicine: Medicine;
  className?: string;
  compact?: boolean;
}

export function MedicineInfoCard({ medicine, className, compact = false }: MedicineInfoCardProps) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-border bg-background p-3',
        className,
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Package className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{medicine.name}</p>
        <p className="text-sm text-text-secondary">{medicine.genericName}</p>
        {!compact && (
          <p className="mt-1 text-xs text-text-secondary">
            {medicine.strength} · {medicine.dosageForm} · {medicine.manufacturer}
          </p>
        )}
      </div>
    </div>
  );
}
