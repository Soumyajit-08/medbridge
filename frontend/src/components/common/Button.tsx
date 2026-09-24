import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white' | 'white-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg hover:shadow-primary/30',
  secondary: 'bg-secondary text-white hover:bg-secondary/90 shadow-md hover:shadow-lg hover:shadow-secondary/30',
  outline: 'border border-border bg-surface text-text-primary hover:bg-background hover:border-primary/50 hover:shadow-xs',
  ghost: 'text-text-primary hover:bg-background/80 hover:text-primary',
  danger: 'bg-critical text-white hover:bg-critical/90 shadow-md hover:shadow-lg hover:shadow-critical/30',
  white: 'bg-white text-primary-dark hover:bg-slate-50 font-bold shadow-md hover:shadow-xl hover:shadow-white/20',
  'white-outline': 'border-2 border-white/70 bg-transparent text-white hover:bg-white/15 font-semibold backdrop-blur-xs hover:border-white',
};

const sizeStyles = {
  sm: 'h-8.5 px-3.5 text-xs font-semibold rounded-lg',
  md: 'h-10 px-4.5 text-sm font-semibold rounded-xl',
  lg: 'h-12 px-6 text-base font-semibold rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 cursor-pointer select-none overflow-hidden',
        'transition-all duration-200 ease-out transform-gpu',
        'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
        // Subtle shimmer sweep on hover for solid variants
        variant !== 'ghost' && 'before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-700 before:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
      <span className="inline-flex items-center gap-2 transition-transform duration-200">
        {children}
      </span>
    </button>
  ),
);

Button.displayName = 'Button';

