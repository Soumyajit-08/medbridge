import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/feedback/Alert';
import { useCreateListing } from '@/hooks/useListings';
import { ROUTES, SAFETY_CHECKLIST_ITEMS } from '@/lib/constants';
import {
  createListingFormSchema,
  type CreateListingFormData,
} from '@/schemas/listingSchemas';
import { cn } from '@/utils/cn';

export function CreateListingPage() {
  const navigate = useNavigate();
  const createListing = useCreateListing();
  const [image, setImage] = useState<File | undefined>();
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const {
    register,
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
          <Alert variant="error">Unable to create listing. Please try again.</Alert>
        )}

        <Input
          label="Medicine ID"
          placeholder="Enter medicine ID from catalog"
          error={errors.medicineId?.message}
          {...register('medicineId', { required: 'Medicine ID is required' })}
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

        <div className="space-y-1.5">
          <label htmlFor="packagingCondition" className="block text-sm font-medium text-text-primary">
            Packaging condition
          </label>
          <select
            id="packagingCondition"
            className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            {...register('packagingCondition')}
          >
            <option value="SEALED_INTACT">Sealed / intact</option>
            <option value="DAMAGED">Damaged</option>
          </select>
        </div>

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

        <div className="space-y-1.5">
          <label htmlFor="image" className="block text-sm font-medium text-text-primary">
            Listing image (optional)
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0])}
            className="text-sm text-text-secondary"
          />
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
