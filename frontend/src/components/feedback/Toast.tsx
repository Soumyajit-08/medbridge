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
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md w-full sm:w-auto"
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
            title={toast.title}
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
  title,
  message,
  Icon,
  onClose,
}: {
  id: string;
  type: keyof typeof icons;
  title?: string;
  message: string;
  Icon: typeof CheckCircle2;
  onClose: () => void;
}) {
  useEffect(() => {
    // Errors stay a bit longer (7s) so users can read the helpful explanation
    const duration = type === 'error' ? 7000 : 5000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [id, onClose, type]);

  return (
    <div
      className={cn(
        'flex min-w-[280px] sm:min-w-[340px] max-w-md items-start gap-3 rounded-2xl border p-4 shadow-xl bg-surface/95 backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3',
        styles[type],
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-bold text-text-primary mb-0.5 leading-tight">
            {title}
          </h4>
        )}
        <p className="text-xs sm:text-sm font-normal text-text-secondary leading-relaxed break-words">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
