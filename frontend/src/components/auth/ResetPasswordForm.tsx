import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/schemas/authSchemas';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/feedback/Alert';

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (password: string) => authService.resetPassword(token, password),
  });

  const onSubmit = handleSubmit(async (data) => {
    await mutation.mutateAsync(data.password);
  });

  if (!token) {
    return (
      <Alert variant="error" title="Invalid reset link">
        This password reset link is missing or expired. Please request a new one.
      </Alert>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="space-y-4">
        <Alert variant="success" title="Password updated">
          Your password has been reset successfully.
        </Alert>
        <Link to={ROUTES.login}>
          <Button className="w-full">Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mutation.isError && (
        <Alert variant="error">
          Unable to reset password. The link may have expired.
        </Alert>
      )}

      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" className="w-full" isLoading={mutation.isPending}>
        Reset password
      </Button>
    </form>
  );
}
