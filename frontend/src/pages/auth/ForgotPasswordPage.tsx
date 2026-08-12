import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <>
      <Helmet>
        <title>Forgot Password — {APP_NAME}</title>
        <meta name="description" content={`Reset your ${APP_NAME} account password.`} />
      </Helmet>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold text-text-primary">Forgot password</h1>
          <div className="mt-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}
