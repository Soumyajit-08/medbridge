import type { OrganizationType } from './auth';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationSubmission {
  id: string;
  recipientId: string;
  organizationName: string;
  organizationType: OrganizationType;
  registrationNumber: string;
  status: VerificationStatus;
  documentUrl?: string;
  documentName?: string;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface VerificationPayload {
  registrationNumber: string;
  document: File;
}
