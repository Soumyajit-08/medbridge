import { z } from 'zod';

export const verificationSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
});

export type VerificationFormData = z.infer<typeof verificationSchema>;
