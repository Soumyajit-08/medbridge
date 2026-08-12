import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
          {trend && <p className="mt-1 text-xs text-secondary flex items-center gap-1"><TrendingUp className="h-3 w-3" />{trend}</p>}
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          {icon ?? <BarChart3 className="h-5 w-5" />}
        </div>
      </div>
    </div>
  );
}
