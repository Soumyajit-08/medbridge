import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Sign In — {APP_NAME}</title>
        <meta name="description" content={`Sign in to your ${APP_NAME} account.`} />
      </Helmet>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-2 text-sm text-text-secondary">Sign in to your {APP_NAME} account</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
