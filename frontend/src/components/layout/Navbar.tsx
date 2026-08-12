import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useUIStore } from '@/store/uiStore';
import { getDashboardPath, getRoleLabel } from '@/utils/roleHelpers';
import { getSidebarNavItems } from '@/components/layout/sidebarNavItems';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';

const publicLinks = [
  { label: 'Home', href: ROUTES.home },
  { label: 'About', href: ROUTES.about },
  { label: 'How It Works', href: ROUTES.howItWorks },
  { label: 'Safety', href: ROUTES.safety },
];

function NotificationBell() {
  const { data } = useNotifications();
  const { notificationPanelOpen, toggleNotificationPanel } = useUIStore();
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <button
      type="button"
      onClick={toggleNotificationPanel}
      className={cn(
        'relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-background hover:text-text-primary',
        notificationPanelOpen && 'bg-background text-primary',
      )}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-background"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </span>
        )}
        <span className="hidden text-sm font-medium text-text-primary sm:block">{user.name}</span>
        <ChevronDown className={cn('h-4 w-4 text-text-secondary transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
          role="menu"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-text-primary">{user.name}</p>
            <p className="text-xs text-text-secondary">{user.email}</p>
            <p className="mt-1 text-xs font-medium text-primary">{getRoleLabel(user.role)}</p>
          </div>
          <div className="p-1">
            <Link
              to={getDashboardPath(user.role)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-background"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-critical hover:bg-critical/5"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { toggleMobileSidebar } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleLinks = user ? getSidebarNavItems(user.role).slice(0, 4) : [];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          {isAuthenticated && (
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="rounded-lg p-2 text-text-secondary hover:bg-background lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to={ROUTES.home} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-sm font-bold text-white">
              M
            </span>
            <span className="text-lg font-semibold text-text-primary">{APP_NAME}</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {(isAuthenticated ? roleLinks : publicLinks).map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.href === ROUTES.home}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to={ROUTES.login} className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to={ROUTES.register}>
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-lg p-2 text-text-secondary hover:bg-background md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </nav>

      {!isAuthenticated && mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {publicLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.href === ROUTES.home}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary',
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to={ROUTES.login}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
