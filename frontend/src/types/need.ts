import type { Medicine } from './medicine';
import type { UrgencyLevel } from './listing';

export type NeedStatus = 'ACTIVE' | 'MATCHED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';

export interface Need {
  id: string;
  recipientId: string;
  medicine: Medicine;
  quantityNeeded: number;
  urgency: UrgencyLevel;
  location: {
    city: string;
    state: string;
  };
  description?: string;
  status: NeedStatus;
  matchCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface CreateNeedPayload {
  medicineId: string;
  quantityNeeded: number;
  urgency: UrgencyLevel;
  city: string;
  state: string;
  description?: string;
  expiresAt: string;
}

export interface PaginatedNeeds {
  data: Need[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
