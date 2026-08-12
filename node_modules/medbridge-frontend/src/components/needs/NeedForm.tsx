import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { needFormSchema, type NeedFormData } from '@/schemas/needSchemas';
import type { Medicine } from '@/types/medicine';
import type { CreateNeedPayload } from '@/types/need';
import { MedicineAutocomplete } from '@/components/medicines/MedicineAutocomplete';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';

export interface NeedFormProps {
  onSubmit: (payload: CreateNeedPayload) => void | Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

const urgencyOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export function NeedForm({ onSubmit, isSubmitting = false, className }: NeedFormProps) {
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

  function handleMedicineChange(medicine: Medicine | null) {
    setValue('medicineId', medicine?.id ?? '');
  }

  async function onFormSubmit(data: NeedFormData) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={cn('space-y-4', className)}>
      <MedicineAutocomplete
        onChange={handleMedicineChange}
        error={errors.medicineId?.message}
      />

      <Input
        label="Quantity Needed"
        type="number"
        min={1}
        {...register('quantityNeeded')}
        error={errors.quantityNeeded?.message}
      />

      <Select
        label="Urgency"
        options={urgencyOptions}
        {...register('urgency')}
        error={errors.urgency?.message}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City"
          {...register('city')}
          error={errors.city?.message}
        />
        <Input
          label="State"
          {...register('state')}
          error={errors.state?.message}
        />
      </div>

      <Input
        label="Need Expires On"
        type="date"
        {...register('expiresAt')}
        error={errors.expiresAt?.message}
      />

      <Textarea
        label="Description (optional)"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Additional details about this need..."
      />

      <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
        Submit Need
      </Button>
    </form>
  );
}
