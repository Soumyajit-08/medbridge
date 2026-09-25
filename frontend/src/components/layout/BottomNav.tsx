import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Heart,
  LayoutDashboard,
  Menu,
  Package,
  PlusCircle,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types/auth';

interface BottomNavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  isSpecial?: boolean;
}

export function BottomNav({ role }: { role?: UserRole }) {
  const { user } = useAuth();
  const { toggleMobileSidebar } = useUIStore();
  const currentRole = role ?? user?.role;

  if (!currentRole) return null;

  let navItems: BottomNavItem[] = [];

  if (currentRole === 'RECIPIENT') {
    navItems = [
      { label: 'Home', href: ROUTES.recipient.dashboard, icon: LayoutDashboard },
      { label: 'Browse', href: ROUTES.recipient.medicines, icon: Search },
      { label: 'Claims', href: ROUTES.recipient.claims, icon: ClipboardList },
      { label: 'Needs', href: ROUTES.recipient.needs, icon: Heart },
    ];
  } else if (currentRole === 'DONOR') {
    navItems = [
      { label: 'Home', href: ROUTES.donor.dashboard, icon: LayoutDashboard },
      { label: 'Listings', href: ROUTES.donor.listings, icon: Package },
      { label: 'Donate', href: ROUTES.donor.createListing, icon: PlusCircle, isSpecial: true },
      { label: 'Claims', href: ROUTES.donor.claims, icon: ClipboardCheck },
    ];
  } else if (currentRole === 'ADMIN') {
    navItems = [
      { label: 'Dashboard', href: ROUTES.admin.dashboard, icon: LayoutDashboard },
      { label: 'Verify', href: ROUTES.admin.verifications, icon: ShieldAlert },
      { label: 'Users', href: ROUTES.admin.users, icon: Users },
      { label: 'Reports', href: ROUTES.admin.reports, icon: AlertTriangle },
    ];
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border/80 bg-surface/95 backdrop-blur-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      aria-label="Mobile Navigation Bar"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.isSpecial) {
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group relative -top-3 flex flex-col items-center justify-center transition-transform active:scale-95',
                    isActive ? 'scale-105' : '',
                  )
                }
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-white shadow-lg shadow-primary/30 ring-4 ring-surface">
                  <Icon className="size-6 text-white" />
                </span>
                <span className="mt-1 text-[10px] font-bold text-primary">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === ROUTES.recipient.dashboard || item.href === ROUTES.donor.dashboard || item.href === ROUTES.admin.dashboard}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center py-1.5 transition-all active:scale-95 select-none',
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-text-muted hover:text-text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn('relative p-1 rounded-xl transition-colors', isActive && 'bg-primary/10')}>
                    <Icon className="size-5" />
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium leading-none">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More/Menu button to open sidebar */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="flex flex-1 flex-col items-center justify-center py-1.5 text-text-muted hover:text-text-primary active:scale-95 select-none cursor-pointer"
          aria-label="Open Navigation Drawer"
        >
          <div className="p-1 rounded-xl">
            <Menu className="size-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-none">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
