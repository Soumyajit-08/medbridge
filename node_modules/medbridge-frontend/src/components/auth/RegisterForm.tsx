import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import {
  donorRegisterSchema,
  recipientRegisterSchema,
  type DonorRegisterFormData,
  type RecipientRegisterFormData,
} from '@/schemas/authSchemas';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/feedback/Alert';
import { cn } from '@/utils/cn';

type RegisterRole = 'DONOR' | 'RECIPIENT';

function RoleToggle({ role, onChange }: { role: RegisterRole; onChange: (r: RegisterRole) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-background p-1">
      {(['DONOR', 'RECIPIENT'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            role === option
              ? 'bg-surface text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {option === 'DONOR' ? 'Donor' : 'Recipient'}
        </button>
      ))}
    </div>
  );
}

function DonorForm({
  onSuccess,
  errorMessage,
  isRegistering,
}: {
  onSuccess: () => void;
  errorMessage: string | null;
  isRegistering: boolean;
}) {
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonorRegisterFormData>({
    resolver: zodResolver(donorRegisterSchema),
    defaultValues: {
      role: 'DONOR',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      donorType: 'HOUSEHOLD',
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const { confirmPassword: _, ...payload } = data;
        await registerUser(payload);
        onSuccess();
      })}
      className="space-y-5"
    >
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <div className="space-y-1.5">
        <label htmlFor="donorType" className="block text-sm font-medium text-text-primary">
          Donor type
        </label>
        <select
          id="donorType"
          className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          {...register('donorType')}
        >
          <option value="HOUSEHOLD">Household</option>
          <option value="PHARMACY">Pharmacy</option>
          <option value="AUTHORIZED_ORGANIZATION">Authorized Organization</option>
        </select>
        {errors.donorType && <p className="text-sm text-critical">{errors.donorType.message}</p>}
      </div>
      <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button type="submit" className="w-full" isLoading={isRegistering}>
        Create account
      </Button>
    </form>
  );
}

function RecipientForm({
  errorMessage,
  isRegistering,
}: {
  errorMessage: string | null;
  isRegistering: boolean;
}) {
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipientRegisterFormData>({
    resolver: zodResolver(recipientRegisterSchema),
    defaultValues: {
      role: 'RECIPIENT',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
      organizationType: 'NGO',
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const { confirmPassword: _, ...payload } = data;
        await registerUser(payload);
      })}
      className="space-y-5"
    >
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <Input label="Organization name" error={errors.organizationName?.message} {...register('organizationName')} />
      <div className="space-y-1.5">
        <label htmlFor="organizationType" className="block text-sm font-medium text-text-primary">
          Organization type
        </label>
        <select
          id="organizationType"
          className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          {...register('organizationType')}
        >
          <option value="NGO">NGO</option>
          <option value="CLINIC">Clinic</option>
          <option value="HOSPITAL">Hospital</option>
          <option value="AUTHORIZED_HEALTHCARE_ORGANIZATION">Authorized Healthcare Organization</option>
        </select>
        {errors.organizationType && <p className="text-sm text-critical">{errors.organizationType.message}</p>}
      </div>
      <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button type="submit" className="w-full" isLoading={isRegistering}>
        Create account
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const [role, setRole] = useState<RegisterRole>('DONOR');
  const { isRegistering, registerError } = useAuth();

  const errorMessage =
    registerError instanceof Error
      ? registerError.message
      : registerError
        ? 'Registration failed. Please check your details and try again.'
        : null;

  return (
    <div className="space-y-5">
      <RoleToggle role={role} onChange={setRole} />
      {role === 'DONOR' ? (
        <DonorForm errorMessage={errorMessage} isRegistering={isRegistering} onSuccess={() => {}} />
      ) : (
        <RecipientForm errorMessage={errorMessage} isRegistering={isRegistering} />
      )}
      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to={ROUTES.login} className="font-medium text-primary hover:text-primary-dark">
          Sign in
        </Link>
      </p>
    </div>
  );
}
