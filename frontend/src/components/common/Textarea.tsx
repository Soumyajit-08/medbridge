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
              'mb-1.5 block text-sm font-medium text-text-primary',
              disabled && 'text-text-secondary',
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
            'flex min-h-[80px] w-full resize-y rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-secondary',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:bg-background disabled:text-text-secondary',
            hasError
              ? 'border-critical focus-visible:ring-critical/50'
              : 'border-border hover:border-text-secondary/40',
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
