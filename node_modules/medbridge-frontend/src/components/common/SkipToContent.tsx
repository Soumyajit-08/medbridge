import { cn } from '@/utils/cn';

export interface SkipToContentProps {
  targetId?: string;
  label?: string;
  className?: string;
}

export function SkipToContent({
  targetId = 'main-content',
  label = 'Skip to main content',
  className,
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]',
        'focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white',
        'focus:shadow-[var(--shadow-card)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary',
        className,
      )}
    >
      {label}
    </a>
  );
}
