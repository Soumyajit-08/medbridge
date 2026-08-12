import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Medicine } from '@/types/medicine';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/utils/cn';

export interface MedicineCardProps {
  medicine: Medicine;
  className?: string;
  linkTo?: string;
  onClick?: () => void;
}

const cardClassName =
  'block rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

export function MedicineCard({ medicine, className, linkTo, onClick }: MedicineCardProps) {
  const href = linkTo ?? ROUTES.recipient.medicineDetails(medicine.id);
  const content = (
  <>
    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Package className="size-5" aria-hidden="true" />
    </div>
    <h3 className="font-semibold text-text-primary">{medicine.name}</h3>
    <p className="mt-1 text-sm text-text-secondary">{medicine.genericName}</p>
    <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
      <span className="rounded-full bg-background px-2 py-0.5">{medicine.category}</span>
      <span className="rounded-full bg-background px-2 py-0.5">
        {medicine.strength} · {medicine.dosageForm}
      </span>
    </div>
  </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cardClassName, 'w-full text-left', className)}>
        {content}
      </button>
    );
  }

  return (
    <Link to={href} className={cn(cardClassName, className)}>
      {content}
    </Link>
  );
}
