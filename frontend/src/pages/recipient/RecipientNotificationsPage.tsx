import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { QueryState } from '@/components/dashboard/QueryState';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

export function RecipientNotificationsPage() {
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Matches, claims, and verification updates"
        actions={
          (data?.unreadCount ?? 0) > 0 ? (
            <Button
              variant="outline"
              size="sm"
              isLoading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!data?.data.length}
        emptyTitle="No notifications"
        emptyDescription="You're all caught up."
      >
        <ul className="space-y-3">
          {data?.data.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                'rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]',
                !notification.read && 'border-primary/20 bg-primary/5',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-text-primary">{notification.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{notification.message}</p>
                  <time className="mt-2 block text-xs text-text-secondary">
                    {formatRelativeTime(notification.createdAt)}
                  </time>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={markRead.isPending}
                    onClick={() => markRead.mutate(notification.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </QueryState>
    </>
  );
}
