import type {
  AdminDashboardStats,
  AuditLogEntry,
  DashboardStats,
  ImpactMetrics,
  ReportEntry,
} from '@/types/dashboard';
import type { Claim } from '@/types/claim';
import type { Listing } from '@/types/listing';
import type { Need } from '@/types/need';
import type { MockUser } from './users';
import type { VerificationSubmission } from '@/types/verification';

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

export function computeDonorDashboardStats(
  listings: Listing[],
  claims: Claim[],
  donorId: string,
): DashboardStats {
  const donorListings = listings.filter((l) => l.donorId === donorId);
  const donorListingIds = new Set(donorListings.map((l) => l.id));
  const donorClaims = claims.filter((c) => donorListingIds.has(c.listingId));

  return {
    totalListings: donorListings.length,
    activeListings: donorListings.filter((l) => l.status === 'ACTIVE' || l.status === 'CLAIM_PENDING').length,
    completedTransfers: donorListings.filter((l) => l.status === 'COMPLETED').length,
    expiredListings: donorListings.filter((l) => l.status === 'EXPIRED').length,
    pendingClaims: donorClaims.filter((c) => c.status === 'PENDING').length,
  };
}

export function computeRecipientDashboardStats(
  claims: Claim[],
  needs: Need[],
  recipientId: string,
): DashboardStats {
  const recipientClaims = claims.filter((c) => c.recipientId === recipientId);
  const recipientNeeds = needs.filter((n) => n.recipientId === recipientId);

  return {
    totalListings: 0,
    activeListings: 0,
    completedTransfers: recipientClaims.filter((c) => c.status === 'COMPLETED').length,
    expiredListings: 0,
    availableMatches: 3,
    activeClaims: recipientClaims.filter((c) => c.status === 'PENDING' || c.status === 'CONFIRMED').length,
    pendingNeeds: recipientNeeds.filter((n) => n.status === 'ACTIVE').length,
  };
}

export function computeAdminDashboardStats(
  users: MockUser[],
  listings: Listing[],
  claims: Claim[],
  verifications: VerificationSubmission[],
  reports: ReportEntry[],
): AdminDashboardStats {
  return {
    totalUsers: users.length,
    pendingVerifications: verifications.filter((v) => v.status === 'PENDING').length,
    activeListings: listings.filter((l) => l.status === 'ACTIVE' || l.status === 'CLAIM_PENDING').length,
    pendingClaims: claims.filter((c) => c.status === 'PENDING').length,
    reports: reports.filter((r) => r.status === 'OPEN').length,
    completedTransfers: listings.filter((l) => l.status === 'COMPLETED').length,
  };
}

export function computeImpactAnalytics(
  listings: Listing[],
  claims: Claim[],
  verifications: VerificationSubmission[],
): ImpactMetrics {
  const completedClaims = claims.filter((c) => c.status === 'COMPLETED');
  const claimedQuantities = completedClaims.reduce((sum, c) => sum + c.requestedQuantity, 0);
  const expiredListings = listings.filter((l) => l.status === 'EXPIRED');
  const expiredQuantities = expiredListings.reduce((sum, l) => sum + l.quantity, 0);
  const totalQuantity = listings.reduce((sum, l) => sum + l.quantity, 0);

  return {
    totalListings: listings.length,
    activeListings: listings.filter((l) => l.status === 'ACTIVE' || l.status === 'CLAIM_PENDING').length,
    completedTransfers: completedClaims.length,
    expiredListings: expiredListings.length,
    claimedQuantities,
    expiredQuantities,
    verifiedOrganizations: verifications.filter((v) => v.status === 'APPROVED').length,
    averageTimeToClaimHours: 18.5,
    averageCompletionTimeHours: 42,
    wastePreventionRate: totalQuantity > 0 ? Math.round((claimedQuantities / totalQuantity) * 100) : 0,
  };
}
