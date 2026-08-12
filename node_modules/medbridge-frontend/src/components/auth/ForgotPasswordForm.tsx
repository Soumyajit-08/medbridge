import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/authSchemas';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/feedback/Alert';

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });

  const onSubmit = handleSubmit(async (data) => {
    await mutation.mutateAsync(data.email);
  });

  if (mutation.isSuccess) {
    return (
      <Alert variant="success" title="Check your email">
        If an account exists for that address, we sent password reset instructions.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mutation.isError && (
        <Alert variant="error">
          Unable to send reset email. Please try again.
        </Alert>
      )}

      <p className="text-sm text-text-secondary">
        Enter the email associated with your account and we&apos;ll send reset instructions.
      </p>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" className="w-full" isLoading={mutation.isPending}>
        Send reset link
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Remember your password?{' '}
        <Link to={ROUTES.login} className="font-medium text-primary hover:text-primary-dark">
          Sign in
        </Link>
      </p>
    </form>
  );
}
