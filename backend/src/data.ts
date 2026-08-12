export type UserRole = 'DONOR' | 'RECIPIENT' | 'ADMIN';
export type DonorType = 'PHARMACY' | 'HOSPITAL' | 'CLINIC' | 'MANUFACTURER';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PackagingCondition = 'SEALED_INTACT' | 'OPEN' | 'DAMAGED';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EXPIRED';
export type ClaimStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type ListingStatus = 'ACTIVE' | 'CLAIM_PENDING' | 'COMPLETED' | 'EXPIRED' | 'REMOVED';
export type NeedStatus = 'ACTIVE' | 'CANCELLED';
export type NotificationType =
  | 'CLAIM_REQUEST'
  | 'CLAIM_CONFIRMED'
  | 'CLAIM_CANCELLED'
  | 'EXPIRY_7_DAYS'
  | 'PICKUP_REMINDER'
  | 'NEW_MATCH'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'REPORT_CREATED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  donorType?: DonorType;
  organizationName?: string;
  organizationType?: string;
  verificationStatus?: VerificationStatus;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  donorType?: DonorType;
  organizationName?: string;
  organizationType?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
}

export interface MedicineSearchResult extends Medicine {
  label: string;
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
  location: {
    city: string;
    state: string;
    postalCode: string;
    approximateDistanceKm?: number;
  };
  status: ListingStatus;
  eligibilityScreeningPassed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingPayload {
  medicineId: string;
  expiryDate: string;
  quantity: number;
  batchNumber: string;
  packagingCondition: PackagingCondition;
  storageConfirmed: boolean;
  city: string;
  state: string;
  postalCode: string;
}

export interface Claim {
  id: string;
  listingId: string;
  recipientId: string;
  recipientOrganization: string;
  recipientVerificationStatus: VerificationStatus;
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
  description: string;
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
  description: string;
  expiresAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface VerificationSubmission {
  id: string;
  recipientId: string;
  organizationName: string;
  organizationType: string;
  registrationNumber: string;
  status: VerificationStatus;
  documentUrl: string;
  documentName: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface ReportEntry {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  reporterName: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  event: string;
  userId: string;
  userName: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  activeListings: number;
  pendingClaims: number;
  reports: number;
  completedTransfers: number;
}

export interface ImpactMetrics {
  totalListings: number;
  activeListings: number;
  completedTransfers: number;
  expiredListings: number;
  claimedQuantities: number;
  expiredQuantities: number;
  verifiedOrganizations: number;
  averageTimeToClaimHours: number;
  averageCompletionTimeHours: number;
  wastePreventionRate: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  donorType?: DonorType;
  organizationName?: string;
  organizationType?: string;
  verificationStatus?: VerificationStatus;
  isActive: boolean;
  createdAt: string;
  password: string;
}

const now = new Date().toISOString();

export const DEMO_PASSWORD = 'password123';

export const initialUsers: User[] = [
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

export const initialMedicines: Medicine[] = [
  {
    id: 'med-paracetamol-500',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    category: 'Analgesic',
    manufacturer: 'Cipla Ltd.',
    dosageForm: 'Tablet',
    strength: '500mg',
  },
  {
    id: 'med-amoxicillin-250',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    manufacturer: 'Sun Pharma',
    dosageForm: 'Capsule',
    strength: '250mg',
  },
  {
    id: 'med-ibuprofen-400',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'NSAID',
    manufacturer: "Dr. Reddy's",
    dosageForm: 'Tablet',
    strength: '400mg',
  },
  {
    id: 'med-metformin-500',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    manufacturer: 'USV Ltd.',
    dosageForm: 'Tablet',
    strength: '500mg',
  },
  {
    id: 'med-omeprazole-20',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    category: 'Antacid',
    manufacturer: 'Torrent Pharma',
    dosageForm: 'Capsule',
    strength: '20mg',
  },
];

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function daysFromNow(days: number): number {
  return days;
}

const paracetamol = initialMedicines.find((m) => m.id === 'med-paracetamol-500')!;
const amoxicillin = initialMedicines.find((m) => m.id === 'med-amoxicillin-250')!;
const ibuprofen = initialMedicines.find((m) => m.id === 'med-ibuprofen-400')!;
const metformin = initialMedicines.find((m) => m.id === 'med-metformin-500')!;

const demoExpiryDays = 15;
const demoExpiryDate = addDays(demoExpiryDays);

export const initialListings: Listing[] = [
  {
    id: 'listing-paracetamol-abc',
    donorId: 'user-donor-abc',
    donorName: 'ABC Pharmacy',
    donorType: 'PHARMACY',
    medicine: paracetamol,
    batchNumber: 'BATCH-PCM-2026-042',
    expiryDate: demoExpiryDate,
    daysRemaining: daysFromNow(demoExpiryDays),
    quantity: 100,
    quantityAvailable: 70,
    urgency: 'HIGH',
    packagingCondition: 'SEALED_INTACT',
    storageConfirmed: true,
    imageUrl: undefined,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      approximateDistanceKm: 2.5,
    },
    status: 'CLAIM_PENDING',
    eligibilityScreeningPassed: true,
    createdAt: '2026-08-10T08:30:00.000Z',
    updatedAt: '2026-08-11T14:00:00.000Z',
  },
  {
    id: 'listing-amoxicillin-abc',
    donorId: 'user-donor-abc',
    donorName: 'ABC Pharmacy',
    donorType: 'PHARMACY',
    medicine: amoxicillin,
    batchNumber: 'BATCH-AMX-2026-018',
    expiryDate: addDays(45),
    daysRemaining: 45,
    quantity: 60,
    quantityAvailable: 60,
    urgency: 'MEDIUM',
    packagingCondition: 'SEALED_INTACT',
    storageConfirmed: true,
    imageUrl: undefined,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      approximateDistanceKm: 2.5,
    },
    status: 'ACTIVE',
    eligibilityScreeningPassed: true,
    createdAt: '2026-08-08T10:00:00.000Z',
    updatedAt: '2026-08-08T10:00:00.000Z',
  },
  {
    id: 'listing-ibuprofen-abc',
    donorId: 'user-donor-abc',
    donorName: 'ABC Pharmacy',
    donorType: 'PHARMACY',
    medicine: ibuprofen,
    batchNumber: 'BATCH-IBU-2026-007',
    expiryDate: addDays(8),
    daysRemaining: 8,
    quantity: 40,
    quantityAvailable: 0,
    urgency: 'CRITICAL',
    packagingCondition: 'SEALED_INTACT',
    storageConfirmed: true,
    imageUrl: undefined,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      approximateDistanceKm: 2.5,
    },
    status: 'COMPLETED',
    eligibilityScreeningPassed: true,
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-08-05T16:30:00.000Z',
  },
];

export const initialClaims: Claim[] = [
  {
    id: 'claim-pending-hope',
    listingId: 'listing-paracetamol-abc',
    recipientId: 'user-recipient-hope',
    recipientOrganization: 'Hope Care Clinic',
    recipientVerificationStatus: 'APPROVED',
    medicine: paracetamol,
    requestedQuantity: 30,
    availableQuantity: 100,
    donorType: 'PHARMACY',
    status: 'PENDING',
    createdAt: '2026-08-11T10:00:00.000Z',
  },
  {
    id: 'claim-confirmed-hope',
    listingId: 'listing-paracetamol-abc',
    recipientId: 'user-recipient-hope',
    recipientOrganization: 'Hope Care Clinic',
    recipientVerificationStatus: 'APPROVED',
    medicine: paracetamol,
    requestedQuantity: 20,
    availableQuantity: 70,
    donorType: 'PHARMACY',
    status: 'CONFIRMED',
    createdAt: '2026-08-10T15:30:00.000Z',
    confirmedAt: '2026-08-10T16:00:00.000Z',
  },
  {
    id: 'claim-completed-ibuprofen',
    listingId: 'listing-ibuprofen-abc',
    recipientId: 'user-recipient-hope',
    recipientOrganization: 'Hope Care Clinic',
    recipientVerificationStatus: 'APPROVED',
    medicine: ibuprofen,
    requestedQuantity: 40,
    availableQuantity: 40,
    donorType: 'PHARMACY',
    status: 'COMPLETED',
    createdAt: '2026-08-01T11:00:00.000Z',
    confirmedAt: '2026-08-01T12:00:00.000Z',
    completedAt: '2026-08-05T16:30:00.000Z',
  },
  {
    id: 'claim-cancelled-paracetamol',
    listingId: 'listing-paracetamol-abc',
    recipientId: 'user-recipient-pending',
    recipientOrganization: 'Sunrise Community Clinic',
    recipientVerificationStatus: 'PENDING',
    medicine: paracetamol,
    requestedQuantity: 10,
    availableQuantity: 100,
    donorType: 'PHARMACY',
    status: 'CANCELLED',
    createdAt: '2026-08-09T09:00:00.000Z',
    cancelledAt: '2026-08-09T14:00:00.000Z',
  },
];

export const initialNeeds: Need[] = [
  {
    id: 'need-paracetamol-hope',
    recipientId: 'user-recipient-hope',
    medicine: paracetamol,
    quantityNeeded: 50,
    urgency: 'HIGH',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    description: 'Urgent need for outpatient fever management at Hope Care Clinic.',
    status: 'ACTIVE',
    matchCount: 1,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-08-09T07:00:00.000Z',
  },
  {
    id: 'need-metformin-hope',
    recipientId: 'user-recipient-hope',
    medicine: metformin,
    quantityNeeded: 100,
    urgency: 'MEDIUM',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    description: 'Monthly stock replenishment for diabetes patients.',
    status: 'ACTIVE',
    matchCount: 0,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-08-05T12:00:00.000Z',
  },
  {
    id: 'need-paracetamol-pending',
    recipientId: 'user-recipient-pending',
    medicine: paracetamol,
    quantityNeeded: 25,
    urgency: 'LOW',
    location: {
      city: 'Pune',
      state: 'Maharashtra',
    },
    description: 'Basic analgesic stock for community health camp.',
    status: 'ACTIVE',
    matchCount: 1,
    expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-08-11T08:00:00.000Z',
  },
];

export interface MockNotification extends Notification {
  userId: string;
}

export const initialNotifications: MockNotification[] = [
  {
    id: 'notif-donor-claim-request',
    userId: 'user-donor-abc',
    type: 'CLAIM_REQUEST',
    title: 'New claim request',
    message: 'Hope Care Clinic requested 30 units of Paracetamol 500mg.',
    read: false,
    link: '/donor/claims',
    createdAt: '2026-08-11T10:00:00.000Z',
  },
  {
    id: 'notif-donor-expiry',
    userId: 'user-donor-abc',
    type: 'EXPIRY_7_DAYS',
    title: 'Listing expiring soon',
    message: 'Your Paracetamol 500mg listing expires in 15 days.',
    read: false,
    link: '/donor/listings/listing-paracetamol-abc',
    createdAt: '2026-08-10T08:00:00.000Z',
  },
  {
    id: 'notif-donor-pickup',
    userId: 'user-donor-abc',
    type: 'PICKUP_REMINDER',
    title: 'Pickup reminder',
    message: 'Confirmed claim from Hope Care Clinic is ready for pickup coordination.',
    read: true,
    link: '/donor/claims',
    createdAt: '2026-08-10T16:30:00.000Z',
  },
  {
    id: 'notif-recipient-match',
    userId: 'user-recipient-hope',
    type: 'NEW_MATCH',
    title: 'New medicine match',
    message: 'ABC Pharmacy listed Paracetamol 500mg near your location.',
    read: false,
    link: '/recipient/medicines/listing-paracetamol-abc',
    createdAt: '2026-08-10T08:30:00.000Z',
  },
  {
    id: 'notif-recipient-confirmed',
    userId: 'user-recipient-hope',
    type: 'CLAIM_CONFIRMED',
    title: 'Claim confirmed',
    message: 'ABC Pharmacy confirmed your claim for 20 units of Paracetamol 500mg.',
    read: false,
    link: '/recipient/claims',
    createdAt: '2026-08-10T16:00:00.000Z',
  },
  {
    id: 'notif-recipient-approved',
    userId: 'user-recipient-hope',
    type: 'VERIFICATION_APPROVED',
    title: 'Verification approved',
    message: 'Hope Care Clinic has been verified. You can now claim medicines.',
    read: true,
    link: '/recipient/verification',
    createdAt: '2026-02-05T10:00:00.000Z',
  },
  {
    id: 'notif-pending-rejected',
    userId: 'user-recipient-pending',
    type: 'CLAIM_CANCELLED',
    title: 'Claim cancelled',
    message: 'Your claim was cancelled because verification is still pending.',
    read: false,
    link: '/recipient/verification',
    createdAt: '2026-08-09T14:00:00.000Z',
  },
  {
    id: 'notif-admin-report',
    userId: 'user-admin',
    type: 'REPORT_CREATED',
    title: 'New listing report',
    message: 'A listing has been reported and requires review.',
    read: false,
    link: '/admin/reports',
    createdAt: '2026-08-11T11:00:00.000Z',
  },
];

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

export const initialReports: ReportEntry[] = [
  {
    id: 'report-001',
    listingId: 'listing-amoxicillin-abc',
    listingTitle: 'Amoxicillin 250mg (Capsule)',
    reason: 'Packaging appears damaged in listing photo.',
    reporterName: 'Anonymous Recipient',
    status: 'OPEN',
    createdAt: '2026-08-11T11:00:00.000Z',
  },
  {
    id: 'report-002',
    listingId: 'listing-ibuprofen-abc',
    listingTitle: 'Ibuprofen 400mg (Tablet)',
    reason: 'Listing information was outdated.',
    reporterName: 'Hope Care Clinic',
    status: 'RESOLVED',
    createdAt: '2026-08-06T09:00:00.000Z',
  },
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    event: 'USER_LOGIN',
    userId: 'user-donor-abc',
    userName: 'ABC Pharmacy',
    resource: 'auth',
    timestamp: '2026-08-12T07:00:00.000Z',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'audit-002',
    event: 'CLAIM_CREATED',
    userId: 'user-recipient-hope',
    userName: 'Hope Care Clinic',
    resource: 'claim-pending-hope',
    timestamp: '2026-08-11T10:00:00.000Z',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'audit-003',
    event: 'VERIFICATION_SUBMITTED',
    userId: 'user-recipient-pending',
    userName: 'Sunrise Community Clinic',
    resource: 'verification-sunrise-pending',
    timestamp: '2026-08-11T09:30:00.000Z',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'audit-004',
    event: 'LISTING_REPORTED',
    userId: 'user-recipient-hope',
    userName: 'Hope Care Clinic',
    resource: 'report-001',
    timestamp: '2026-08-11T11:00:00.000Z',
    ipAddress: '127.0.0.1',
  },
];

export function toAuthUser(user: User): AuthUser {
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

export function toSearchResult(medicine: Medicine): MedicineSearchResult {
  return {
    ...medicine,
    label: `${medicine.name} ${medicine.strength} (${medicine.dosageForm})`,
  };
}
