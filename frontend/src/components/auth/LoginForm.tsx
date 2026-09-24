import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/schemas/authSchemas';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/feedback/Alert';
import { cn } from '@/utils/cn';

type LoginPortal = 'USER' | 'ADMIN';

export function LoginForm() {
  const [portal, setPortal] = useState<LoginPortal>('USER');
  const { login, isLoggingIn, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    await login({ ...data, portal });
  });

  const errorMessage =
    loginError instanceof Error
      ? loginError.message
      : loginError
        ? 'Invalid email or password. Please try again.'
        : null;

  return (
    <div className="space-y-5">
      {/* Role / Portal Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Select Login Portal
        </label>
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 dark:bg-[#0B132B] p-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setPortal('USER')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer',
              portal === 'USER'
                ? 'bg-primary text-white shadow-md scale-[1.01]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80',
            )}
          >
            <Users className="size-4" />
            <span>Donor & Recipient</span>
          </button>

          <button
            type="button"
            onClick={() => setPortal('ADMIN')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer',
              portal === 'ADMIN'
                ? 'bg-amber-600 text-white shadow-md scale-[1.01]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80',
            )}
          >
            <ShieldCheck className="size-4" />
            <span>Administrator</span>
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder={portal === 'ADMIN' ? 'admin@medbridge.dev' : 'you@example.com'}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-end">
          <Link
            to={ROUTES.forgotPassword}
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className={cn(
            'w-full font-semibold',
            portal === 'ADMIN' && 'bg-amber-600 hover:bg-amber-700 border-amber-600',
          )}
          isLoading={isLoggingIn}
        >
          {portal === 'ADMIN' ? (
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Sign in to Admin Panel
            </span>
          ) : (
            'Sign in to MedBridge'
          )}
        </Button>

        {portal === 'USER' && (
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to={ROUTES.register} className="font-semibold text-primary hover:text-primary-dark">
              Register here
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
