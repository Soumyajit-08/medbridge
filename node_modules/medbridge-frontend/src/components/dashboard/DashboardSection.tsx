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
        'rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111C38] p-6 shadow-sm transition-all duration-200',
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
