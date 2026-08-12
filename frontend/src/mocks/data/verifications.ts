import type { VerificationSubmission } from '@/types/verification';

export const initialVerifications: VerificationSubmission[] = [
  {
    id: 'verification-hope-approved',
    recipientId: 'user-recipient-hope',
    organizationName: 'Hope Care Clinic',
    organizationType: 'CLINIC',
    registrationNumber: 'MH-CLINIC-2024-8842',
    status: 'APPROVED',
    documentUrl: '/mock/documents/hope-care-license.pdf',
    documentName: 'hope-care-license.pdf',
    submittedAt: '2026-02-01T10:00:00.000Z',
    reviewedAt: '2026-02-05T10:00:00.000Z',
  },
  {
    id: 'verification-sunrise-pending',
    recipientId: 'user-recipient-pending',
    organizationName: 'Sunrise Community Clinic',
    organizationType: 'CLINIC',
    registrationNumber: 'MH-CLINIC-2026-1205',
    status: 'PENDING',
    documentUrl: '/mock/documents/sunrise-registration.pdf',
    documentName: 'sunrise-registration.pdf',
    submittedAt: '2026-08-11T09:30:00.000Z',
  },
];
