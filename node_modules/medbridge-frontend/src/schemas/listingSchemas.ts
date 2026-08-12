import { z } from 'zod';

export const listingStep1Schema = z.object({
  medicineId: z.string().min(1, 'Please select a medicine'),
  genericName: z.string(),
  category: z.string(),
  manufacturer: z.string(),
  dosageForm: z.string(),
  strength: z.string(),
});

export const listingStep2Schema = z.object({
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

export const listingStep3Schema = z.object({
  packagingCondition: z.enum(['SEALED_INTACT', 'DAMAGED']),
  storageConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm appropriate storage' }),
  }),
});

export const listingStep5Schema = z.object({
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
});

export const safetyChecklistSchema = z.object({
  identifiable: z.literal(true),
  originalPackaging: z.literal(true),
  sealedIntact: z.literal(true),
  batchVisible: z.literal(true),
  expiryVisible: z.literal(true),
  notExpired: z.literal(true),
  storageConfirmed: z.literal(true),
  notDamaged: z.literal(true),
  notRestricted: z.literal(true),
});

export const createListingFormSchema = listingStep2Schema
  .merge(listingStep3Schema)
  .merge(listingStep5Schema)
  .extend({ medicineId: z.string().min(1, 'Please select a medicine') });

export type CreateListingFormData = z.infer<typeof createListingFormSchema>;
export type ListingStep1Data = z.infer<typeof listingStep1Schema>;
export type ListingStep2Data = z.infer<typeof listingStep2Schema>;
export type ListingStep3Data = z.infer<typeof listingStep3Schema>;
export type ListingStep5Data = z.infer<typeof listingStep5Schema>;
export type SafetyChecklistData = z.infer<typeof safetyChecklistSchema>;
