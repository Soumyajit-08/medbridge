import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, SearchX } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';

export function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Page Not Found — {APP_NAME}</title>
      </Helmet>

      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <SearchX className="size-12 text-text-secondary" aria-hidden="true" />
        <p className="mt-4 text-6xl font-bold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">Page not found</h1>
        <p className="mt-2 max-w-md text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to={ROUTES.home} className="mt-8">
          <Button variant="outline">
            <Home className="size-4" aria-hidden="true" />
            Go home
          </Button>
        </Link>
      </div>
    </>
  );
}
