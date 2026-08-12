import { Building2, Package, Pill } from 'lucide-react';
import type { Medicine } from '@/types/medicine';
import { cn } from '@/utils/cn';

export interface MedicineDetailsProps {
  medicine: Medicine;
  className?: string;
}

export function MedicineDetails({ medicine, className }: MedicineDetailsProps) {
  const fields = [
    { label: 'Generic Name', value: medicine.genericName, icon: Pill },
    { label: 'Category', value: medicine.category, icon: Package },
    { label: 'Manufacturer', value: medicine.manufacturer, icon: Building2 },
    { label: 'Dosage Form', value: medicine.dosageForm, icon: Pill },
    { label: 'Strength', value: medicine.strength, icon: Pill },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">{medicine.name}</h2>
        <p className="mt-1 text-text-secondary">{medicine.genericName}</p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-background p-4"
          >
            <dt className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
