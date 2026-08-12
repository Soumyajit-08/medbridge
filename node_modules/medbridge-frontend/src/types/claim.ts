import type { DonorType } from './auth';
import type { Medicine } from './medicine';

export type ClaimStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Claim {
  id: string;
  listingId: string;
  recipientId: string;
  recipientOrganization: string;
  recipientVerificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  medicine: Medicine;
  requestedQuantity: number;
  availableQuantity: number;
  donorType: DonorType;
  status: ClaimStatus;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface CreateClaimPayload {
  listingId: string;
  requestedQuantity: number;
}

export interface PaginatedClaims {
  data: Claim[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
