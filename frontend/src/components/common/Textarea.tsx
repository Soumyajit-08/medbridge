import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id: idProp, required, disabled, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200',
              disabled && 'text-slate-400',
            )}
          >
            {label}
            {required && (
              <span className="ml-0.5 text-critical" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            'flex min-h-[80px] w-full resize-y rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B132B] px-3.5 py-2 text-sm text-slate-900 dark:text-white shadow-2xs',
            'placeholder:text-slate-400 dark:placeholder-slate-500',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400',
            hasError
              ? 'border-critical focus-visible:ring-critical/50'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
            className,
          )}
          {...props}
        />

        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-critical" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
