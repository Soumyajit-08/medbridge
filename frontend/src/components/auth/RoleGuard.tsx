import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { canAccessRoute, getDashboardPath } from '@/utils/roleHelpers';
import { ROUTES } from '@/lib/constants';
import type { UserRole } from '@/types/auth';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!canAccessRoute(user.role, allowedRoles)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
