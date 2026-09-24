import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/utils/roleHelpers';

export function ForbiddenPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <Helmet>
        <title>Forbidden — {APP_NAME}</title>
      </Helmet>

      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <ShieldAlert className="size-12 text-critical" aria-hidden="true" />
        <p className="mt-4 text-6xl font-bold text-primary">403</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">Access denied</h1>
        <p className="mt-2 max-w-md text-text-secondary">
          {user
            ? `You are signed in as ${user.name} (${user.role}), which doesn't have permission to view this page.`
            : "You don't have permission to view this page."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user && (
            <Link to={getDashboardPath(user.role)}>
              <Button variant="primary">
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Go to my dashboard
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={handleSwitchAccount}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign in as Admin
          </Button>
          <Link to={ROUTES.home}>
            <Button variant="ghost">
              <Home className="size-4" aria-hidden="true" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

