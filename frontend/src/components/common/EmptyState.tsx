import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-12 text-center',
        className,
      )}
    >
      <div
        className="mb-4 flex size-14 items-center justify-center rounded-full bg-background text-text-secondary"
        aria-hidden="true"
      >
        <Icon className="size-7" />
      </div>

      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
