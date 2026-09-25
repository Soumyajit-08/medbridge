import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { ROUTES } from '@/lib/constants';
import { formatRelativeTime, formatDateTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import type { Notification } from '@/types/notification';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'CLAIM_CONFIRMED':
      return <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />;
    case 'CLAIM_CANCELLED':
      return <XCircle className="size-4 text-rose-500" aria-hidden="true" />;
    case 'CLAIM_REQUEST':
      return <ClipboardList className="size-4 text-primary" aria-hidden="true" />;
    case 'NEW_MATCH':
      return <Heart className="size-4 text-amber-500" aria-hidden="true" />;
    case 'VERIFICATION_SUBMITTED':
    case 'VERIFICATION_PENDING':
      return <ShieldAlert className="size-4 text-amber-500" aria-hidden="true" />;
    case 'VERIFICATION_APPROVED':
      return <ShieldCheck className="size-4 text-emerald-500" aria-hidden="true" />;
    case 'VERIFICATION_REJECTED':
      return <ShieldAlert className="size-4 text-rose-500" aria-hidden="true" />;
    case 'EXPIRY_7_DAYS':
    case 'EXPIRY_3_DAYS':
    case 'EXPIRY_1_DAY':
    case 'LISTING_EXPIRED':
    case 'PICKUP_REMINDER':
      return <Clock className="size-4 text-amber-500" aria-hidden="true" />;
    default:
      return <Bell className="size-4 text-primary" aria-hidden="true" />;
  }
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data } = useNotifications();
  const { notificationPanelOpen, setNotificationPanelOpen, toggleNotificationPanel } = useUIStore();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.data ?? [];

  const allNotificationsPath =
    user?.role === 'DONOR'
      ? ROUTES.donor.notifications
      : user?.role === 'RECIPIENT'
      ? ROUTES.recipient.notifications
      : user?.role === 'ADMIN'
      ? ROUTES.admin.verifications
      : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationPanelOpen(false);
      }
    }
    if (notificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationPanelOpen, setNotificationPanelOpen]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    if (notification.link) {
      setNotificationPanelOpen(false);
      navigate(notification.link);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={toggleNotificationPanel}
        className={cn(
          'relative inline-flex size-9 items-center justify-center rounded-xl border border-border/80 bg-surface/80 text-text-secondary transition-all',
          'hover:border-primary/40 hover:bg-background hover:text-primary active:scale-95 cursor-pointer shadow-2xs',
          notificationPanelOpen && 'bg-background text-primary border-primary/40 ring-2 ring-primary/20',
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={notificationPanelOpen}
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {notificationPanelOpen && (
        <div
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 z-50 sm:w-96 max-h-[80vh] overflow-hidden rounded-2xl border border-border bg-surface/98 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          role="region"
          aria-label="Notifications Panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-text-secondary">
                <Bell className="mx-auto size-8 opacity-40 mb-2" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-0.5 text-text-muted">We'll alert you here when there are updates.</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'group relative flex items-start gap-3 p-3 text-left transition-colors hover:bg-background/80',
                    !notification.read && 'bg-primary/5',
                  )}
                >
                  <div className="mt-0.5 shrink-0 rounded-full p-1 bg-surface border border-border">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn('text-xs truncate', !notification.read ? 'font-semibold text-text-primary' : 'font-medium text-text-primary')}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className="text-[11px] text-text-muted cursor-help"
                        title={formatDateTime(notification.createdAt)}
                      >
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline">
                          View details <ExternalLink className="size-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead.mutate(notification.id);
                        }}
                        className="rounded p-1 text-text-secondary hover:bg-surface hover:text-primary"
                        title="Mark as read"
                      >
                        <Check className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification.mutate(notification.id);
                      }}
                      className="rounded p-1 text-text-secondary hover:bg-surface hover:text-danger"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {allNotificationsPath && (
            <div className="border-t border-border p-2 bg-surface text-center">
              <Link
                to={allNotificationsPath}
                onClick={() => setNotificationPanelOpen(false)}
                className="block w-full rounded-lg py-1.5 text-xs font-medium text-text-primary hover:bg-background transition-colors"
              >
                {user?.role === 'ADMIN' ? 'Go to Verification Queue' : 'View all notifications'}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
