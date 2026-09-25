import { formatRelativeTime, formatDateTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityListProps {
  items: ActivityItem[];
  emptyMessage?: string;
  className?: string;
}

export function ActivityList({
  items,
  emptyMessage = 'No recent activity.',
  className,
}: ActivityListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">{emptyMessage}</p>;
  }

  return (
    <ul className={cn('divide-y divide-border', className)}>
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">{item.title}</p>
            <p className="mt-0.5 text-sm text-text-secondary">{item.description}</p>
          </div>
          <time
            className="shrink-0 text-xs text-text-secondary cursor-help"
            title={formatDateTime(item.timestamp)}
          >
            {formatRelativeTime(item.timestamp)}
          </time>
        </li>
      ))}
    </ul>
  );
}
