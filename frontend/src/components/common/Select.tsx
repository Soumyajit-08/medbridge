import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      placeholder,
      id: idProp,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
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

        <div className="relative">
          <select
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            className={cn(
              'flex h-11 w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B132B] px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white shadow-2xs [color-scheme:light] dark:[color-scheme:dark]',
              'transition-all duration-200 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary',
              'disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400',
              hasError
                ? 'border-critical focus-visible:ring-critical/50'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-white dark:bg-[#0B132B] text-slate-500 dark:text-slate-400">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white py-1"
              >
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
        </div>

        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-critical" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

