import type { AuthUser } from '@/types/auth';
import type { User } from '@/types/user';

export interface MockUser extends User {
  password: string;
}

const now = new Date().toISOString();

export const DEMO_PASSWORD = 'password123';

export const initialUsers: MockUser[] = [
  {
    id: 'user-donor-abc',
    name: 'ABC Pharmacy',
    email: 'donor@abcpharmacy.com',
    phone: '+91-9876543210',
    password: DEMO_PASSWORD,
    role: 'DONOR',
    donorType: 'PHARMACY',
    isActive: true,
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'user-recipient-hope',
    name: 'Dr. Priya Sharma',
    email: 'recipient@hopecare.com',
    phone: '+91-9876543211',
    password: DEMO_PASSWORD,
    role: 'RECIPIENT',
    organizationName: 'Hope Care Clinic',
    organizationType: 'CLINIC',
    verificationStatus: 'APPROVED',
    isActive: true,
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'user-recipient-pending',
    name: 'Dr. Raj Mehta',
    email: 'recipient-pending@clinic.com',
    phone: '+91-9876543212',
    password: DEMO_PASSWORD,
    role: 'RECIPIENT',
    organizationName: 'Sunrise Community Clinic',
    organizationType: 'CLINIC',
    verificationStatus: 'PENDING',
    isActive: true,
    createdAt: now,
  },
  {
    id: 'user-admin',
    name: 'Admin User',
    email: 'admin@medbridge.com',
    phone: '+91-9876543213',
    password: DEMO_PASSWORD,
    role: 'ADMIN',
    isActive: true,
    createdAt: '2025-12-01T08:00:00.000Z',
  },
];

export function toAuthUser(user: MockUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    donorType: user.donorType,
    organizationName: user.organizationName,
    organizationType: user.organizationType,
    verificationStatus: user.verificationStatus,
  };
}
