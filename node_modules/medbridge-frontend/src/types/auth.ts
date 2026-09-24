export type UserRole = 'DONOR' | 'RECIPIENT' | 'ADMIN';

export type DonorType = 'HOUSEHOLD' | 'PHARMACY' | 'AUTHORIZED_ORGANIZATION';

export type OrganizationType = 'NGO' | 'CLINIC' | 'HOSPITAL' | 'AUTHORIZED_HEALTHCARE_ORGANIZATION';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  donorType?: DonorType;
  organizationName?: string;
  organizationType?: OrganizationType;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  portal?: 'USER' | 'ADMIN';
}

export interface RegisterDonorData {
  role: 'DONOR';
  name: string;
  email: string;
  phone: string;
  password: string;
  donorType: DonorType;
}

export interface RegisterRecipientData {
  role: 'RECIPIENT';
  name: string;
  email: string;
  phone: string;
  password: string;
  organizationName: string;
  organizationType: OrganizationType;
}

export type RegisterData = RegisterDonorData | RegisterRecipientData;

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
