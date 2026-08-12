import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Listing } from '@/types/listing';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { MedicineInfoCard } from '@/components/medicines/MedicineInfoCard';
import { EligibilityResult } from '@/components/listings/EligibilityResult';

const claimSchema = z.object({
  requestedQuantity: z.coerce
    .number()
    .min(1, 'Quantity must be at least 1'),
});

type ClaimFormData = z.infer<typeof claimSchema>;

export interface ClaimRequestModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestedQuantity: number) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function ClaimRequestModal({
  listing,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ClaimRequestModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: { requestedQuantity: 1 },
  });

  async function onFormSubmit(data: ClaimFormData) {
    if (data.requestedQuantity > listing.quantityAvailable) {
      setError('requestedQuantity', {
        message: `Maximum available quantity is ${listing.quantityAvailable}`,
      });
      return;
    }
    await onSubmit(data.requestedQuantity);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Claim"
      description="Submit a claim request for this medicine listing."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <MedicineInfoCard medicine={listing.medicine} />

        <p className="text-sm text-text-secondary">
          Available quantity: {listing.quantityAvailable}
        </p>

        <Input
          label="Requested Quantity"
          type="number"
          min={1}
          max={listing.quantityAvailable}
          {...register('requestedQuantity')}
          error={errors.requestedQuantity?.message}
        />

        <EligibilityResult passed={listing.eligibilityScreeningPassed} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Submit Claim
          </Button>
        </div>
      </form>
    </Modal>
  );
}
