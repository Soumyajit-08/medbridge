import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export type StatVariant = 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose' | 'primary';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: StatVariant;
}

const variantThemeMap: Record<
  StatVariant,
  {
    iconBg: string;
    hoverIconBg: string;
    hoverBorder: string;
    hoverGlow: string;
    accentBar: string;
  }
> = {
  blue: {
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    hoverIconBg: 'group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/25',
    hoverBorder: 'hover:border-blue-500/60 dark:hover:border-blue-400/60 hover:shadow-blue-500/10',
    hoverGlow: 'from-blue-500/10 via-blue-500/5 to-transparent',
    accentBar: 'bg-blue-500',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    hoverIconBg: 'group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-emerald-500/25',
    hoverBorder: 'hover:border-emerald-500/60 dark:hover:border-emerald-400/60 hover:shadow-emerald-500/10',
    hoverGlow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    accentBar: 'bg-emerald-500',
  },
  amber: {
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    hoverIconBg: 'group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-amber-500/25',
    hoverBorder: 'hover:border-amber-500/60 dark:hover:border-amber-400/60 hover:shadow-amber-500/10',
    hoverGlow: 'from-amber-500/10 via-amber-500/5 to-transparent',
    accentBar: 'bg-amber-500',
  },
  purple: {
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    hoverIconBg: 'group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-purple-500/25',
    hoverBorder: 'hover:border-purple-500/60 dark:hover:border-purple-400/60 hover:shadow-purple-500/10',
    hoverGlow: 'from-purple-500/10 via-purple-500/5 to-transparent',
    accentBar: 'bg-purple-500',
  },
  cyan: {
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    hoverIconBg: 'group-hover:bg-cyan-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-cyan-500/25',
    hoverBorder: 'hover:border-cyan-500/60 dark:hover:border-cyan-400/60 hover:shadow-cyan-500/10',
    hoverGlow: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
    accentBar: 'bg-cyan-500',
  },
  rose: {
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
    hoverIconBg: 'group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-rose-500/25',
    hoverBorder: 'hover:border-rose-500/60 dark:hover:border-rose-400/60 hover:shadow-rose-500/10',
    hoverGlow: 'from-rose-500/10 via-rose-500/5 to-transparent',
    accentBar: 'bg-rose-500',
  },
  primary: {
    iconBg: 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400',
    hoverIconBg: 'group-hover:bg-primary group-hover:text-white group-hover:shadow-md group-hover:shadow-primary/25',
    hoverBorder: 'hover:border-primary/60 dark:hover:border-blue-400/60 hover:shadow-primary/10',
    hoverGlow: 'from-primary/10 via-primary/5 to-transparent',
    accentBar: 'bg-primary',
  },
};

function autoDetectVariant(label: string): StatVariant {
  const lower = label.toLowerCase();
  if (lower.includes('active') || lower.includes('verified') || lower.includes('complete') || lower.includes('rescued') || lower.includes('approved')) {
    return 'emerald';
  }
  if (lower.includes('pending') || lower.includes('review') || lower.includes('urgent') || lower.includes('request')) {
    return 'amber';
  }
  if (lower.includes('history') || lower.includes('transfer') || lower.includes('deliver') || lower.includes('claim')) {
    return 'purple';
  }
  if (lower.includes('available') || lower.includes('match') || lower.includes('need') || lower.includes('browse')) {
    return 'cyan';
  }
  return 'blue';
}

export function StatCard({ label, value, icon: Icon, trend, href, onClick, className, variant }: StatCardProps) {
  const resolvedVariant = variant ?? autoDetectVariant(label);
  const theme = variantThemeMap[resolvedVariant];

  const content = (
    <>
      {/* Background ambient glow aura on hover */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl',
          theme.hoverGlow,
        )}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:scale-[1.03] transition-transform origin-left duration-200">
            {value}
          </p>
          {trend && <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{trend}</p>}
        </div>

        {/* Animated Icon Box with color pulse & lift */}
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-xs transition-all duration-300 group-hover:scale-110',
            theme.iconBg,
            theme.hoverIconBg,
          )}
        >
          <Icon className="size-6 transition-transform duration-300 group-hover:rotate-6" aria-hidden="true" />
        </div>
      </div>

      {/* Interactive Bottom Color Accent Stripe */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-40 group-hover:opacity-100 group-hover:h-1.5 transition-all duration-300',
          theme.accentBar,
        )}
      />
    </>
  );

  const cardClasses = cn(
    'relative overflow-hidden rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111C38] p-5.5 shadow-sm block',
    'transition-all duration-300 ease-out transform-gpu',
    (href || onClick)
      ? 'group hover:-translate-y-1.5 hover:shadow-xl cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
      : 'group hover:-translate-y-1 hover:shadow-md',
    // Shimmer light beam sweep on hover
    'before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/10 before:to-transparent before:transition-transform before:duration-700 before:pointer-events-none before:z-20',
    theme.hoverBorder,
    className,
  );

  if (href) {
    return (
      <Link to={href} className={cardClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cardClasses, 'w-full text-left')}>
        {content}
      </button>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}

