import type { DonorType } from './auth';
import type { Medicine } from './medicine';

export type ListingStatus =
  | 'ACTIVE'
  | 'CLAIM_PENDING'
  | 'CLAIMED'
  | 'COMPLETED'
  | 'REMOVED'
  | 'EXPIRED';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EXPIRED';

export type PackagingCondition = 'SEALED_INTACT' | 'DAMAGED';

export interface ListingLocation {
  city: string;
  state: string;
  postalCode: string;
  approximateDistanceKm?: number;
}

export interface Listing {
  id: string;
  donorId: string;
  donorName: string;
  donorType: DonorType;
  medicine: Medicine;
  batchNumber: string;
  expiryDate: string;
  daysRemaining: number;
  quantity: number;
  quantityAvailable: number;
  urgency: UrgencyLevel;
  packagingCondition: PackagingCondition;
  storageConfirmed: boolean;
  imageUrl?: string;
  location: ListingLocation;
  status: ListingStatus;
  eligibilityScreeningPassed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingFilters {
  search?: string;
  urgency?: UrgencyLevel[];
  category?: string;
  donorType?: DonorType[];
  expiryWindow?: number;
  maxDistance?: number;
  sort?: 'urgency' | 'distance' | 'newest';
  page?: number;
  limit?: number;
  mine?: boolean;
}

export interface CreateListingPayload {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  packagingCondition: PackagingCondition;
  storageConfirmed: boolean;
  city: string;
  state: string;
  postalCode: string;
  safetyChecklist: Record<string, boolean>;
}

export interface PaginatedListings {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
