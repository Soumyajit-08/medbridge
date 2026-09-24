export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MedBridge';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

export const ELIGIBILITY_MESSAGE =
  'Passed MedBridge preliminary eligibility screening — authorized review required.';

export const REGULATORY_DISCLAIMER =
  'MedBridge is a portfolio/demo application intended to demonstrate software engineering concepts around medicine-surplus coordination, verification, matching, expiry tracking, and traceability. The application does not independently determine whether a medicine is legally eligible for redistribution and does not replace professional pharmaceutical, medical, or regulatory review.';

export const SAFETY_CHECKLIST_ITEMS = [
  { key: 'identifiable', label: 'Medicine is identifiable' },
  { key: 'originalPackaging', label: 'Original packaging is available' },
  { key: 'sealedIntact', label: 'Packaging is sealed/intact' },
  { key: 'batchVisible', label: 'Batch number is visible' },
  { key: 'expiryVisible', label: 'Expiry date is visible' },
  { key: 'notExpired', label: 'Medicine is not expired' },
  { key: 'storageConfirmed', label: 'Appropriate storage confirmed' },
  { key: 'notDamaged', label: 'Medicine is not damaged/contaminated' },
  { key: 'notRestricted', label: 'Medicine is not in a restricted category according to configured policy' },
] as const;

export const DEFAULT_PAGE_SIZE = 12;

export const ROUTES = {
  home: '/',
  about: '/about',
  howItWorks: '/how-it-works',
  safety: '/safety',
  privacy: '/privacy',
  terms: '/terms',
  regulatory: '/regulatory-disclaimer',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  donor: {
    dashboard: '/donor',
    listings: '/donor/listings',
    createListing: '/donor/listings/new',
    listingDetails: (id: string) => `/donor/listings/${id}`,
    claims: '/donor/claims',
    history: '/donor/history',
    profile: '/donor/profile',
    notifications: '/donor/notifications',
  },
  recipient: {
    dashboard: '/recipient',
    medicines: '/recipient/medicines',
    medicineDetails: (id: string) => `/recipient/medicines/${id}`,
    claims: '/recipient/claims',
    needs: '/recipient/needs',
    createNeed: '/recipient/needs/new',
    verification: '/recipient/verification',
    profile: '/recipient/profile',
    notifications: '/recipient/notifications',
  },
  admin: {
    dashboard: '/admin',
    verifications: '/admin/verifications',
    verificationDetails: (id: string) => `/admin/verifications/${id}`,
    reports: '/admin/reports',
    users: '/admin/users',
    listings: '/admin/listings',
    auditLogs: '/admin/audit-logs',
  },
} as const;
