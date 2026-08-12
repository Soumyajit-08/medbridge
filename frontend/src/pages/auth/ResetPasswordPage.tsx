import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export function ResetPasswordPage() {
  return (
    <>
      <Helmet>
        <title>Reset Password — {APP_NAME}</title>
        <meta name="description" content={`Set a new password for your ${APP_NAME} account.`} />
      </Helmet>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold text-text-primary">Reset password</h1>
          <div className="mt-8">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}
