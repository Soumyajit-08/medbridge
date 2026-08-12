import { z } from 'zod';

export const needFormSchema = z.object({
  medicineId: z.string().min(1, 'Please select a medicine'),
  quantityNeeded: z.coerce.number().min(1, 'Quantity must be at least 1'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  description: z.string().optional(),
  expiresAt: z.string().min(1, 'Expiry date is required'),
});

export type NeedFormData = z.infer<typeof needFormSchema>;
