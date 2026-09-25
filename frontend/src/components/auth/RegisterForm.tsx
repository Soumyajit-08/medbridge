import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
import { Select } from '@/components/common/Select';
import { Alert } from '@/components/feedback/Alert';
import { cn } from '@/utils/cn';

const DONOR_TYPE_OPTIONS = [
  { value: 'HOUSEHOLD', label: 'Household' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'AUTHORIZED_ORGANIZATION', label: 'Authorized Organization' },
];

const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'NGO', label: 'NGO' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'AUTHORIZED_HEALTHCARE_ORGANIZATION', label: 'Authorized Healthcare Organization' },
];

type RegisterRole = 'DONOR' | 'RECIPIENT';

function RoleToggle({ role, onChange }: { role: RegisterRole; onChange: (r: RegisterRole) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 dark:bg-[#0B132B] p-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
      {(['DONOR', 'RECIPIENT'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer',
            role === option
              ? 'bg-primary text-white shadow-md scale-[1.01]'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80',
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <Select
        label="Donor type"
        options={DONOR_TYPE_OPTIONS}
        error={errors.donorType?.message}
        {...register('donorType')}
      />
      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <Select
        label="Organization type"
        options={ORGANIZATION_TYPE_OPTIONS}
        error={errors.organizationType?.message}
        {...register('organizationType')}
      />
      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
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
