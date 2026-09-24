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
        'group/med flex gap-3 rounded-xl border border-border bg-background p-3 transition-all duration-200',
        className,
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover/med:scale-105 group-hover/med:bg-primary group-hover/med:text-white">
        <Package className="size-5 transition-transform duration-300 group-hover/med:rotate-3" aria-hidden="true" />
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
