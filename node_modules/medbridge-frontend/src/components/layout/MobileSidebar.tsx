import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getSidebarNavItems } from '@/components/layout/sidebarNavItems';
import { getRoleLabel } from '@/utils/roleHelpers';
import { cn } from '@/utils/cn';

export function MobileSidebar({ role }: { role?: import('@/types/auth').UserRole }) {
  const user = useAuthStore((s) => s.user);
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

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-text-primary/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface shadow-xl transition-transform duration-300 lg:hidden',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!mobileSidebarOpen}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{user.name}</p>
            <p className="text-xs text-text-secondary">{getRoleLabel(user.role)}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-background"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href.endsWith('/donor') || href.endsWith('/recipient') || href.endsWith('/admin')}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary',
                )
              }
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
