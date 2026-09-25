import type { DonorType } from './auth';
import type { Medicine } from './medicine';

export type ClaimStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface DonorContact {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  donorType?: DonorType | string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface RecipientContact {
  id?: string;
  name?: string;
  organizationName?: string;
  organizationType?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  verificationStatus?: string;
}

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
  cancellationReason?: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupState?: string;
  pickupPincode?: string;
  donor?: DonorContact;
  recipient?: RecipientContact;
  listing?: {
    id?: string;
    batchNumber?: string;
    expiryDate?: string;
    packagingCondition?: string;
    storageConditions?: string;
    pickupAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    donor?: DonorContact;
  };
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
