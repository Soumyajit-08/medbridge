import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

type AlertVariant = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const config: Record<AlertVariant, { icon: typeof Info; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'border-secondary/20 bg-secondary/5 text-text-primary',
  },
  error: {
    icon: AlertCircle,
    className: 'border-critical/20 bg-critical/5 text-text-primary',
  },
  info: {
    icon: Info,
    className: 'border-primary/20 bg-primary/5 text-text-primary',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-accent/20 bg-accent/5 text-text-primary',
  },
};

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { icon: Icon, className: variantClass } = config[variant];

  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-xl border p-4', variantClass, className)}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          variant === 'success' && 'text-secondary',
          variant === 'error' && 'text-critical',
          variant === 'info' && 'text-primary',
          variant === 'warning' && 'text-accent',
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        {title && <p className="mb-1 text-sm font-semibold">{title}</p>}
        <div className="text-sm text-text-secondary">{children}</div>
      </div>
    </div>
  );
}
