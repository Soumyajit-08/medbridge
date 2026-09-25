import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, ChevronRight, LogOut, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { getSidebarNavItems } from '@/components/layout/sidebarNavItems';
import { getRoleLabel } from '@/utils/roleHelpers';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/utils/cn';

export function MobileSidebar({ role }: { role?: import('@/types/auth').UserRole }) {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  if (!user) return null;

  const navItems = getSidebarNavItems(role ?? user.role);

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    DONOR: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
    RECIPIENT: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    ADMIN: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  };

  const badge = roleColors[user.role] ?? {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  };

  return (
    <>
      {/* Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out lg:hidden border-r border-border',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!mobileSidebarOpen}
        aria-label="Mobile Navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-background/50">
          <Link
            to={ROUTES.home}
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-2"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold shadow-sm">
              <Activity className="size-4.5 text-white" />
            </span>
            <span className="text-base font-extrabold tracking-tight text-text-primary">
              Med<span className="text-primary">Bridge</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="inline-flex size-8 items-center justify-center rounded-xl border border-border/80 text-text-secondary hover:bg-background hover:text-text-primary"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="size-11 rounded-xl object-cover ring-2 ring-border shadow-sm shrink-0"
              />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm shrink-0">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-primary">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold border leading-none', badge.bg, badge.text, badge.border)}>
                  {getRoleLabel(user.role)}
                </span>
                {user.organizationName && (
                  <span className="truncate text-[11px] text-text-muted">
                    {user.organizationName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Menu Navigation
          </p>
          {navItems.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary',
                )
              }
              onClick={() => setMobileSidebarOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Icon className="size-5 shrink-0" />
                <span>{label}</span>
              </div>
              <ChevronRight className="size-4 opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 bg-background/50 space-y-2">
          <button
            type="button"
            onClick={() => {
              setMobileSidebarOpen(false);
              logout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
