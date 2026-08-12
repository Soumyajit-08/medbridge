import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/feedback/Alert';
import { useCreateNeed } from '@/hooks/useNeeds';
import { needFormSchema, type NeedFormData } from '@/schemas/needSchemas';
import { ROUTES } from '@/lib/constants';

export function CreateNeedPage() {
  const navigate = useNavigate();
  const createNeed = useCreateNeed();

  const {
    register,
    handleSubmit,
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

        <Input
          label="Medicine ID"
          placeholder="Enter medicine ID from catalog"
          error={errors.medicineId?.message}
          {...register('medicineId')}
        />

        <Input
          label="Quantity needed"
          type="number"
          min={1}
          error={errors.quantityNeeded?.message}
          {...register('quantityNeeded')}
        />

        <div className="space-y-1.5">
          <label htmlFor="urgency" className="block text-sm font-medium text-text-primary">
            Urgency
          </label>
          <select
            id="urgency"
            className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            {...register('urgency')}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

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
