export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  completedTransfers: number;
  expiredListings: number;
  pendingClaims?: number;
  availableMatches?: number;
  activeClaims?: number;
  pendingNeeds?: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
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

export interface AdminDashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  activeListings: number;
  pendingClaims: number;
  reports: number;
  completedTransfers: number;
}

export interface AuditLogEntry {
  id: string;
  event: string;
  userId: string;
  userName: string;
  resource: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ReportEntry {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  reporterName: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}
