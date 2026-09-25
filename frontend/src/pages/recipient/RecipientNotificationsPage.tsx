import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Heart,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { QueryState } from '@/components/dashboard/QueryState';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { formatRelativeTime, formatDateTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'CLAIM_CONFIRMED':
      return <CheckCircle2 className="size-5 text-emerald-500" aria-hidden="true" />;
    case 'CLAIM_CANCELLED':
      return <XCircle className="size-5 text-rose-500" aria-hidden="true" />;
    case 'CLAIM_REQUEST':
      return <ClipboardList className="size-5 text-primary" aria-hidden="true" />;
    case 'NEW_MATCH':
      return <Heart className="size-5 text-amber-500" aria-hidden="true" />;
    case 'VERIFICATION_APPROVED':
      return <ShieldCheck className="size-5 text-emerald-500" aria-hidden="true" />;
    case 'VERIFICATION_REJECTED':
      return <ShieldAlert className="size-5 text-rose-500" aria-hidden="true" />;
    case 'EXPIRY_7_DAYS':
    case 'EXPIRY_3_DAYS':
    case 'EXPIRY_1_DAY':
    case 'LISTING_EXPIRED':
    case 'PICKUP_REMINDER':
      return <Clock className="size-5 text-amber-500" aria-hidden="true" />;
    default:
      return <Bell className="size-5 text-primary" aria-hidden="true" />;
  }
}

export function RecipientNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const allNotifications = data?.data ?? [];
  const filteredNotifications =
    filter === 'unread'
      ? allNotifications.filter((n) => !n.read)
      : allNotifications;

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
              <Check className="size-4 mr-1" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          )}
        >
          All ({allNotifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filter === 'unread'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          )}
        >
          Unread ({data?.unreadCount ?? 0})
        </button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!filteredNotifications.length}
        emptyTitle={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
        emptyDescription="You're all caught up."
      >
        <ul className="space-y-3">
          {filteredNotifications.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                'rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all',
                !notification.read && 'border-primary/30 bg-primary/5 shadow-md',
              )}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0 rounded-full p-2 bg-surface border border-border">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn('text-sm', !notification.read ? 'font-semibold text-text-primary' : 'font-medium text-text-primary')}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-text-secondary">{notification.message}</p>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <time
                      className="text-xs text-text-muted cursor-help"
                      title={formatDateTime(notification.createdAt)}
                    >
                      {formatRelativeTime(notification.createdAt)}
                    </time>

                    {notification.link && (
                      <Link
                        to={notification.link}
                        onClick={() => {
                          if (!notification.read) markRead.mutate(notification.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Go to item <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={markRead.isPending}
                      onClick={() => markRead.mutate(notification.id)}
                      title="Mark as read"
                    >
                      <Check className="size-4" />
                      <span className="hidden sm:inline ml-1">Mark read</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-danger hover:bg-danger/10"
                    isLoading={deleteNotification.isPending}
                    onClick={() => deleteNotification.mutate(notification.id)}
                    title="Delete notification"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </QueryState>
    </>
  );
}
