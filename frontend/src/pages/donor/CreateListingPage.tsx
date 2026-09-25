import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/feedback/Alert';
import { MedicineAutocomplete } from '@/components/medicines/MedicineAutocomplete';
import type { Medicine } from '@/types/medicine';
import { useCreateListing } from '@/hooks/useListings';
import { ROUTES, SAFETY_CHECKLIST_ITEMS } from '@/lib/constants';
import {
  createListingFormSchema,
  type CreateListingFormData,
} from '@/schemas/listingSchemas';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/services/api';

const PACKAGING_CONDITION_OPTIONS = [
  { value: 'SEALED_INTACT', label: 'Sealed / intact' },
  { value: 'DAMAGED', label: 'Damaged' },
];

export function CreateListingPage() {
  const navigate = useNavigate();
  const createListing = useCreateListing();
  const [image, setImage] = useState<File | undefined>();
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingFormSchema),
    defaultValues: {
      medicineId: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 1,
      packagingCondition: 'SEALED_INTACT',
      storageConfirmed: true,
      city: '',
      state: '',
      postalCode: '',
    },
  });

  const allChecked = SAFETY_CHECKLIST_ITEMS.every((item) => checklist[item.key]);

  const onSubmit = handleSubmit(async (data) => {
    if (!allChecked) return;
    const listing = await createListing.mutateAsync({
      payload: {
        medicineId: data.medicineId,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        quantity: data.quantity,
        packagingCondition: data.packagingCondition,
        storageConfirmed: data.storageConfirmed,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        safetyChecklist: checklist,
      },
      image,
    });
    navigate(ROUTES.donor.listingDetails(listing.id));
  });

  return (
    <>
      <PageHeader
        title="Create listing"
        subtitle="List surplus medicine with safety checklist confirmation"
      />

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-2xl space-y-8 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
      >
        {createListing.isError && (
          <Alert variant="error">{getErrorMessage(createListing.error)}</Alert>
        )}

        <MedicineAutocomplete
          value={selectedMedicine}
          onChange={(medicine) => {
            setSelectedMedicine(medicine);
            setValue('medicineId', medicine?.id ?? '', { shouldValidate: true });
          }}
          error={errors.medicineId?.message}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Batch number"
            error={errors.batchNumber?.message}
            {...register('batchNumber')}
          />
          <Input
            label="Expiry date"
            type="date"
            error={errors.expiryDate?.message}
            {...register('expiryDate')}
          />
        </div>

        <Input
          label="Quantity"
          type="number"
          min={1}
          error={errors.quantity?.message}
          {...register('quantity')}
        />

        <Select
          label="Packaging condition"
          options={PACKAGING_CONDITION_OPTIONS}
          error={errors.packagingCondition?.message}
          {...register('packagingCondition')}
        />

        <fieldset>
          <legend className="text-sm font-medium text-text-primary">Safety checklist</legend>
          <ul className="mt-3 space-y-2">
            {SAFETY_CHECKLIST_ITEMS.map((item) => (
              <li key={item.key}>
                <label className="flex items-start gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={checklist[item.key] ?? false}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="mt-0.5"
                  />
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
          {!allChecked && (
            <p className="mt-2 text-xs text-accent">All checklist items must be confirmed.</p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Input label="State" error={errors.state?.message} {...register('state')} />
          <Input label="Postal code" error={errors.postalCode?.message} {...register('postalCode')} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-text-primary">
            Medicine Packaging Image (optional)
          </label>
          {image ? (
            <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-background p-3">
              <div className="flex items-center gap-4">
                <img
                  src={URL.createObjectURL(image)}
                  alt="Medicine packaging preview"
                  className="size-20 rounded-lg object-cover border border-border shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{image.name}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {(image.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                  </p>
                  <button
                    type="button"
                    onClick={() => setImage(undefined)}
                    className="mt-2 text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                  >
                    Remove photo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background/50 p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/[0.02]"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-text-primary">
                Click to upload medicine photo or drag and drop
              </span>
              <span className="text-[11px] text-text-muted mt-1">PNG, JPG, WebP up to 10MB</span>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0])}
                className="hidden"
              />
            </label>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input type="checkbox" {...register('storageConfirmed')} className="mt-0.5" />
          I confirm appropriate storage conditions were maintained
        </label>

        <Button
          type="submit"
          isLoading={createListing.isPending}
          disabled={!allChecked}
          className={cn(!allChecked && 'opacity-60')}
        >
          Create listing
        </Button>
      </form>
    </>
  );
}
