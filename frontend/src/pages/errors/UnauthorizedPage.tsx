import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LogIn } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';

export function UnauthorizedPage() {
  return (
    <>
      <Helmet>
        <title>Unauthorized — {APP_NAME}</title>
      </Helmet>

      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-6xl font-bold text-primary">401</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">Authentication required</h1>
        <p className="mt-2 max-w-md text-text-secondary">
          Please sign in to access this page.
        </p>
        <Link to={ROUTES.login} className="mt-8">
          <Button>
            <LogIn className="size-4" aria-hidden="true" />
            Sign in
          </Button>
        </Link>
      </div>
    </>
  );
}
