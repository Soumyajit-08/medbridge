import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]',
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
