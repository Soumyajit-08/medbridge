import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Medicine } from '@/types/medicine';
import type { CreateListingPayload } from '@/types/listing';
import {
  listingStep1Schema,
  listingStep2Schema,
  listingStep3Schema,
  listingStep5Schema,
  safetyChecklistSchema,
  type ListingStep1Data,
  type ListingStep2Data,
  type ListingStep3Data,
  type ListingStep5Data,
  type SafetyChecklistData,
} from '@/schemas/listingSchemas';
import { SAFETY_CHECKLIST_ITEMS } from '@/lib/constants';
import { MedicineAutocomplete } from '@/components/medicines/MedicineAutocomplete';
import { MedicineInfoCard } from '@/components/medicines/MedicineInfoCard';
import { FileUploader } from '@/components/verification/FileUploader';
import { EligibilityResult } from './EligibilityResult';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Medicine' },
  { id: 2, title: 'Details' },
  { id: 3, title: 'Packaging' },
  { id: 4, title: 'Safety' },
  { id: 5, title: 'Location' },
  { id: 6, title: 'Photo' },
  { id: 7, title: 'Review' },
] as const;

export interface ListingFormProps {
  onSubmit: (payload: CreateListingPayload, image?: File) => void | Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export function ListingForm({ onSubmit, isSubmitting = false, className }: ListingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [step1Data, setStep1Data] = useState<ListingStep1Data | null>(null);
  const [step2Data, setStep2Data] = useState<ListingStep2Data | null>(null);
  const [step3Data, setStep3Data] = useState<ListingStep3Data | null>(null);
  const [checklistData, setChecklistData] = useState<SafetyChecklistData | null>(null);
  const [step5Data, setStep5Data] = useState<ListingStep5Data | null>(null);

  const step1Form = useForm<ListingStep1Data>({
    resolver: zodResolver(listingStep1Schema),
    defaultValues: {
      medicineId: '',
      genericName: '',
      category: '',
      manufacturer: '',
      dosageForm: '',
      strength: '',
    },
  });

  const step2Form = useForm<ListingStep2Data>({
    resolver: zodResolver(listingStep2Schema),
    defaultValues: { batchNumber: '', expiryDate: '', quantity: 1 },
  });

  const step3Form = useForm<ListingStep3Data>({
    resolver: zodResolver(listingStep3Schema),
    defaultValues: { packagingCondition: 'SEALED_INTACT', storageConfirmed: undefined },
  });

  const step5Form = useForm<ListingStep5Data>({
    resolver: zodResolver(listingStep5Schema),
    defaultValues: { city: '', state: '', postalCode: '' },
  });

  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(SAFETY_CHECKLIST_ITEMS.map((item) => [item.key, false])),
  );
  const [checklistError, setChecklistError] = useState<string | null>(null);

  function handleMedicineChange(medicine: Medicine | null) {
    setSelectedMedicine(medicine);
    if (medicine) {
      step1Form.setValue('medicineId', medicine.id);
      step1Form.setValue('genericName', medicine.genericName);
      step1Form.setValue('category', medicine.category);
      step1Form.setValue('manufacturer', medicine.manufacturer);
      step1Form.setValue('dosageForm', medicine.dosageForm);
      step1Form.setValue('strength', medicine.strength);
    }
  }

  async function handleNext() {
    if (step === 1) {
      const valid = await step1Form.trigger();
      if (!valid || !selectedMedicine) return;
      setStep1Data(step1Form.getValues());
      setStep(2);
    } else if (step === 2) {
      const valid = await step2Form.trigger();
      if (!valid) return;
      setStep2Data(step2Form.getValues());
      setStep(3);
    } else if (step === 3) {
      const valid = await step3Form.trigger();
      if (!valid) return;
      setStep3Data(step3Form.getValues());
      setStep(4);
    } else if (step === 4) {
      const allChecked = SAFETY_CHECKLIST_ITEMS.every((item) => checklist[item.key]);
      if (!allChecked) {
        setChecklistError('All safety checklist items must be confirmed.');
        return;
      }
      setChecklistError(null);
      const parsed = safetyChecklistSchema.safeParse(checklist);
      if (!parsed.success) return;
      setChecklistData(parsed.data);
      setStep(5);
    } else if (step === 5) {
      const valid = await step5Form.trigger();
      if (!valid) return;
      setStep5Data(step5Form.getValues());
      setStep(6);
    } else if (step === 6) {
      setStep(7);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!step1Data || !step2Data || !step3Data || !checklistData || !step5Data) return;

    const payload: CreateListingPayload = {
      medicineId: step1Data.medicineId,
      batchNumber: step2Data.batchNumber,
      expiryDate: step2Data.expiryDate,
      quantity: step2Data.quantity,
      packagingCondition: step3Data.packagingCondition,
      storageConfirmed: step3Data.storageConfirmed,
      city: step5Data.city,
      state: step5Data.state,
      postalCode: step5Data.postalCode,
      safetyChecklist: checklistData,
    };

    await onSubmit(payload, image ?? undefined);
  }

  return (
    <div className={cn('space-y-6', className)}>
      <nav aria-label="Form progress">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s) => (
            <li
              key={s.id}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                step === s.id
                  ? 'bg-primary text-white'
                  : step > s.id
                    ? 'bg-secondary/10 text-secondary'
                    : 'bg-background text-text-secondary',
              )}
            >
              {step > s.id && <Check className="size-3" aria-hidden="true" />}
              <span>{s.title}</span>
            </li>
          ))}
        </ol>
      </nav>

      {step === 1 && (
        <div className="space-y-4">
          <MedicineAutocomplete
            value={selectedMedicine}
            onChange={handleMedicineChange}
            error={step1Form.formState.errors.medicineId?.message}
          />
          {selectedMedicine && <MedicineInfoCard medicine={selectedMedicine} />}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Batch Number"
            {...step2Form.register('batchNumber')}
            error={step2Form.formState.errors.batchNumber?.message}
          />
          <Input
            label="Expiry Date"
            type="date"
            {...step2Form.register('expiryDate')}
            error={step2Form.formState.errors.expiryDate?.message}
          />
          <Input
            label="Quantity"
            type="number"
            min={1}
            {...step2Form.register('quantity')}
            error={step2Form.formState.errors.quantity?.message}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Select
            label="Packaging Condition"
            options={[
              { value: 'SEALED_INTACT', label: 'Sealed / Intact' },
              { value: 'DAMAGED', label: 'Damaged' },
            ]}
            {...step3Form.register('packagingCondition')}
            error={step3Form.formState.errors.packagingCondition?.message}
          />
          <label className="flex items-start gap-3 rounded-lg border border-border p-4">
            <input
              type="checkbox"
              className="mt-1"
              {...step3Form.register('storageConfirmed')}
            />
            <span className="text-sm text-text-primary">
              I confirm this medicine has been stored under appropriate conditions.
            </span>
          </label>
          {step3Form.formState.errors.storageConfirmed && (
            <p className="text-sm text-critical">
              {step3Form.formState.errors.storageConfirmed.message}
            </p>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Confirm all safety checklist items before proceeding.
          </p>
          {SAFETY_CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <input
                type="checkbox"
                checked={checklist[item.key]}
                onChange={(e) =>
                  setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                }
                className="mt-0.5"
              />
              <span className="text-sm text-text-primary">{item.label}</span>
            </label>
          ))}
          {checklistError && (
            <p className="text-sm text-critical" role="alert">{checklistError}</p>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <Input
            label="City"
            {...step5Form.register('city')}
            error={step5Form.formState.errors.city?.message}
          />
          <Input
            label="State"
            {...step5Form.register('state')}
            error={step5Form.formState.errors.state?.message}
          />
          <Input
            label="Postal Code"
            {...step5Form.register('postalCode')}
            error={step5Form.formState.errors.postalCode?.message}
          />
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Upload a photo of the medicine packaging (optional but recommended).
          </p>
          <FileUploader
            accept="image/jpeg,image/png,image/webp"
            maxSizeMb={5}
            onFileSelect={setImage}
            selectedFile={image}
          />
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          {selectedMedicine && <MedicineInfoCard medicine={selectedMedicine} />}
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {step2Data && (
              <>
                <div>
                  <dt className="text-text-secondary">Batch</dt>
                  <dd className="font-medium">{step2Data.batchNumber}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Quantity</dt>
                  <dd className="font-medium">{step2Data.quantity}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Expiry</dt>
                  <dd className="font-medium">{step2Data.expiryDate}</dd>
                </div>
              </>
            )}
            {step5Data && (
              <div>
                <dt className="text-text-secondary">Location</dt>
                <dd className="font-medium">
                  {step5Data.city}, {step5Data.state} {step5Data.postalCode}
                </dd>
              </div>
            )}
          </dl>
          <EligibilityResult />
        </div>
      )}

      <div className="flex justify-between gap-4 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || isSubmitting}
        >
          Back
        </Button>
        {step < 7 ? (
          <Button type="button" onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit Listing
          </Button>
        )}
      </div>
    </div>
  );
}
