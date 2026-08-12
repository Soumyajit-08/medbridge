import type { DonorType, OrganizationType, UserRole } from './auth';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  donorType?: DonorType;
  organizationName?: string;
  organizationType?: OrganizationType;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  createdAt: string;
}
