import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/schemas/authSchemas';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/feedback/Alert';

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        endIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        {...register('password')}
      />

      <Input
        label="Confirm password"
        type={showConfirmPassword ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder="Re-enter your password"
        error={errors.confirmPassword?.message}
        endIcon={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        {...register('confirmPassword')}
      />

      <Button type="submit" className="w-full" isLoading={mutation.isPending}>
        Reset password
      </Button>
    </form>
  );
}
