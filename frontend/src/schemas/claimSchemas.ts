import { z } from 'zod';

export const claimRequestSchema = z.object({
  requestedQuantity: z.coerce
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(10000, 'Quantity exceeds maximum'),
});

export type ClaimRequestFormData = z.infer<typeof claimRequestSchema>;
