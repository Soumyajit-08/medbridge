import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { MedicineAutocomplete } from '@/components/medicines/MedicineAutocomplete';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/feedback/Alert';
import { useCreateNeed } from '@/hooks/useNeeds';
import { needFormSchema, type NeedFormData } from '@/schemas/needSchemas';
import { ROUTES } from '@/lib/constants';

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export function CreateNeedPage() {
  const navigate = useNavigate();
  const createNeed = useCreateNeed();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NeedFormData>({
    resolver: zodResolver(needFormSchema),
    defaultValues: {
      medicineId: '',
      quantityNeeded: 1,
      urgency: 'MEDIUM',
      city: '',
      state: '',
      description: '',
      expiresAt: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    await createNeed.mutateAsync(data);
    navigate(ROUTES.recipient.needs);
  });

  return (
    <>
      <PageHeader title="Post medicine need" subtitle="Describe what your organization needs" />

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-2xl space-y-6 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
      >
        {createNeed.isError && (
          <Alert variant="error">Unable to post need. Please try again.</Alert>
        )}

        <MedicineAutocomplete
          label="Medicine name"
          onChange={(medicine) => setValue('medicineId', medicine?.id ?? '')}
          error={errors.medicineId?.message}
        />

        <Input
          label="Quantity needed"
          type="number"
          min={1}
          error={errors.quantityNeeded?.message}
          {...register('quantityNeeded')}
        />

        <Select
          label="Urgency"
          options={URGENCY_OPTIONS}
          error={errors.urgency?.message}
          {...register('urgency')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Input label="State" error={errors.state?.message} {...register('state')} />
        </div>

        <Input
          label="Need expires on"
          type="date"
          error={errors.expiresAt?.message}
          {...register('expiresAt')}
        />

        <Textarea
          label="Description (optional)"
          placeholder="Additional details about this need..."
          error={errors.description?.message}
          {...register('description')}
        />

        <Button type="submit" isLoading={createNeed.isPending}>
          Post need
        </Button>
      </form>
    </>
  );
}
