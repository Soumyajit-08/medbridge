import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <>
      <Helmet>
        <title>Register — {APP_NAME}</title>
        <meta name="description" content={`Create a ${APP_NAME} donor or recipient account.`} />
      </Helmet>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Join as a donor or verified recipient organization
          </p>
          <div className="mt-8">
            <RegisterForm />
          </div>
        </div>
      </div>
    </>
  );
}
