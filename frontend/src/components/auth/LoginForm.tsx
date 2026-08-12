import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '@/schemas/authSchemas';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/feedback/Alert';

export function LoginForm() {
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
    await login(data);
  });

  const errorMessage =
    loginError instanceof Error
      ? loginError.message
      : loginError
        ? 'Invalid email or password. Please try again.'
        : null;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
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

      <Button type="submit" className="w-full" isLoading={isLoggingIn}>
        Sign in
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.register} className="font-medium text-primary hover:text-primary-dark">
          Register
        </Link>
      </p>
    </form>
  );
}
