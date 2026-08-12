import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getSidebarNavItems } from '@/components/layout/sidebarNavItems';
import { getRoleLabel } from '@/utils/roleHelpers';
import { cn } from '@/utils/cn';

interface SidebarProps {
  role?: import('@/types/auth').UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const { sidebarOpen, toggleSidebar } = useUIStore();

  if (!user) return null;

  const navItems = getSidebarNavItems(role ?? user.role);

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-border bg-surface transition-all duration-300 lg:flex',
        sidebarOpen ? 'w-64' : 'w-[72px]',
      )}
    >
      <div className={cn('flex items-center border-b border-border p-4', sidebarOpen ? 'justify-between' : 'justify-center')}>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{user.name}</p>
            <p className="text-xs text-text-secondary">{getRoleLabel(user.role)}</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
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
                !sidebarOpen && 'justify-center px-2',
              )
            }
            title={!sidebarOpen ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
