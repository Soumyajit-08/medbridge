import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Activity, ArrowRight, ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { getDashboardPath, getRoleLabel } from '@/utils/roleHelpers';
import { getSidebarNavItems } from '@/components/layout/sidebarNavItems';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const publicLinks = [
  { label: 'Home', href: ROUTES.home },
  { label: 'About', href: ROUTES.about },
  { label: 'How It Works', href: ROUTES.howItWorks },
  { label: 'Safety', href: ROUTES.safety },
];

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

  const roleBadges: Record<string, { label: string; color: string }> = {
    DONOR: { label: 'Donor', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    RECIPIENT: { label: 'Recipient', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    ADMIN: { label: 'Admin', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  };

  const badge = roleBadges[user.role] ?? {
    label: getRoleLabel(user.role),
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300',
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-200 cursor-pointer select-none',
          'border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800',
          open && 'ring-2 ring-primary/40 border-primary/50',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="size-8 rounded-lg object-cover ring-1 ring-border shadow-2xs"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-2xs">
            {initials}
          </span>
        )}
        <div className="hidden text-left sm:block min-w-0">
          <p className="text-xs font-semibold text-text-primary leading-tight truncate max-w-[120px]">{user.name}</p>
          <span className={cn('inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold border leading-none', badge.color)}>
            {badge.label}
          </span>
        </div>
        <ChevronDown className={cn('size-3.5 text-text-secondary transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0E172F]/95 backdrop-blur-xl shadow-xl transition-all duration-200"
          role="menu"
        >
          <div className="border-b border-border/80 px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
            <p className="text-xs text-text-secondary truncate mt-0.5">{user.email}</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            <Link
              to={getDashboardPath(user.role)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="size-4 text-primary" />
              <span>Dashboard Overview</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-critical hover:bg-critical/10 transition-colors cursor-pointer"
              role="menuitem"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#070D1E]/90 backdrop-blur-xl shadow-2xs transition-colors">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-7">
          {isAuthenticated && (
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="rounded-xl p-2 text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </button>
          )}

          <Link to={ROUTES.home} className="flex items-center gap-2.5 group">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white font-extrabold shadow-md group-hover:scale-105 transition-transform duration-200">
              <Activity className="size-5 text-white" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Med<span className="text-primary dark:text-blue-400">Bridge</span>
              </span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" title="Platform Operational" />
            </div>
          </Link>

          <div className="hidden items-center gap-1.5 md:flex">
            {(isAuthenticated ? roleLinks : publicLinks).map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-blue-500/20 dark:text-blue-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <NotificationDropdown />
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
              <UserMenu />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={ROUTES.login} className="hidden sm:block">
                <Button variant="ghost" size="sm" className="font-semibold text-xs">
                  Sign in
                </Button>
              </Link>
              <Link to={ROUTES.register}>
                <Button size="sm" className="font-semibold text-xs shadow-md group">
                  Register
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          )}

          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-xl p-2 text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {!isAuthenticated && mobileMenuOpen && (
        <div className="border-t border-border/80 bg-surface/98 backdrop-blur-xl px-4 py-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            {publicLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-primary/10 text-primary font-bold' : 'text-text-secondary hover:bg-background',
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-border/80 mt-2 flex gap-2">
              <Link
                to={ROUTES.login}
                className="flex-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="outline" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link
                to={ROUTES.register}
                className="flex-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button size="sm" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
