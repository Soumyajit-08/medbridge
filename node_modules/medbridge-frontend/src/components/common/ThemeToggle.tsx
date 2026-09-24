import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition-all',
        'hover:border-primary/40 hover:bg-background hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'cursor-pointer shadow-2xs',
        className,
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun
        className={cn(
          'size-4.5 transition-all duration-300',
          isDark ? 'rotate-90 scale-0 opacity-0 absolute' : 'rotate-0 scale-100 opacity-100 text-amber-500',
        )}
      />
      <Moon
        className={cn(
          'size-4.5 transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100 text-teal-400' : '-rotate-90 scale-0 opacity-0 absolute',
        )}
      />
    </button>
  );
}
