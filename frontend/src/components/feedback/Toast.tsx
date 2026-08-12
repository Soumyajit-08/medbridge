import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'border-secondary/20 bg-secondary/5 text-secondary',
  error: 'border-critical/20 bg-critical/5 text-critical',
  info: 'border-primary/20 bg-primary/5 text-primary',
  warning: 'border-accent/20 bg-accent/5 text-accent',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <ToastItem
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            Icon={Icon}
            onClose={() => removeToast(toast.id)}
          />
        );
      })}
    </div>
  );
}

function ToastItem({
  id,
  type,
  message,
  Icon,
  onClose,
}: {
  id: string;
  type: keyof typeof icons;
  message: string;
  Icon: typeof CheckCircle2;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={cn(
        'flex min-w-[280px] max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg bg-surface',
        styles[type],
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
