import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import {
  AuthUser,
  Claim,
  CreateClaimPayload,
  CreateListingPayload,
  CreateNeedPayload,
  Listing,
  Medicine,
  Notification,
  NotificationType,
  PaginatedResponse,
  RegisterData,
  ReportEntry,
  VerificationSubmission,
  User,
  UserRole,
  VerificationStatus,
  UrgencyLevel,
  DonorType,
  PackagingCondition,
  initialAuditLogs,
  initialClaims,
  initialListings,
  initialMedicines,
  initialNeeds,
  initialNotifications,
  initialReports,
  initialUsers,
  initialVerifications,
  toAuthUser,
  toSearchResult,
} from './data';

const app = express();
const upload = multer();
const API_PREFIX = '/api/v1';
const PORT = Number(process.env.PORT || 8000);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.options('*', cors({ origin: true, credentials: true }));

const state = {
  users: structuredClone(initialUsers) as User[],
  medicines: structuredClone(initialMedicines) as Medicine[],
  listings: structuredClone(initialListings) as Listing[],
  claims: structuredClone(initialClaims) as Claim[],
  needs: structuredClone(initialNeeds),
  notifications: structuredClone(initialNotifications),
  verifications: structuredClone(initialVerifications),
  reports: structuredClone(initialReports),
  auditLogs: structuredClone(initialAuditLogs),
  accessTokens: new Map<string, string>(),
  refreshTokens: new Map<string, string>(),
  resetTokens: new Map<string, string>(),
};

function isoNow(): string {
  return new Date().toISOString();
}

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function daysRemaining(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyFromDays(days: number): UrgencyLevel {
  if (days <= 0) return 'EXPIRED';
  if (days <= 7) return 'CRITICAL';
  if (days <= 14) return 'HIGH';
  if (days <= 30) return 'MEDIUM';
  return 'LOW';
}

function refreshListingComputed(listing: Listing): Listing {
  const days = daysRemaining(listing.expiryDate);
  return {
    ...listing,
    daysRemaining: days,
    urgency: listing.status === 'EXPIRED' ? 'EXPIRED' : urgencyFromDays(days),
  };
}

function getBearerToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return undefined;
  return auth.slice(7);
}

function getUserFromRequest(req: Request): User | undefined {
  const token = getBearerToken(req);
  if (token) {
    const userId = state.accessTokens.get(token);
    if (userId) return state.users.find((u) => u.id === userId);
  }

  const refreshToken = req.cookies?.medbridge_refresh;
  if (refreshToken) {
    const userId = state.refreshTokens.get(refreshToken);
    if (userId) return state.users.find((u) => u.id === userId);
  }

  return undefined;
}

function requireAuth(req: Request, res: Response): User | null {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  return user;
}

function createTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = `mock-access-${userId}-${Date.now()}`;
  const refreshToken = `mock-refresh-${userId}-${Date.now()}`;
  state.accessTokens.set(accessToken, userId);
  state.refreshTokens.set(refreshToken, userId);
  return { accessToken, refreshToken };
}

function authResponse(user: User): { user: AuthUser; accessToken: string; _refreshToken: string } {
  const { accessToken, refreshToken } = createTokens(user.id);
  return {
    user: toAuthUser(user),
    accessToken,
    _refreshToken: refreshToken,
  };
}

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie('medbridge_refresh', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie('medbridge_refresh', { path: '/' });
}

function paginate<T>(items: T[], page = 1, limit = 12): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
}

function addAuditLog(event: string, user: User, resource: string): void {
  state.auditLogs.unshift({
    id: generateId('audit'),
    event,
    userId: user.id,
    userName: user.organizationName ?? user.name,
    resource,
    timestamp: isoNow(),
    ipAddress: '127.0.0.1',
  });
}

function addNotification(userId: string, notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void {
  state.notifications.unshift({
    ...notification,
    id: generateId('notif'),
    userId,
    read: false,
    createdAt: isoNow(),
  });
}

function getMedicineById(id: string): Medicine | undefined {
  return state.medicines.find((m) => m.id === id);
}

function getListingById(id: string): Listing | undefined {
  const listing = state.listings.find((l) => l.id === id);
  return listing ? refreshListingComputed(listing) : undefined;
}

function filterListings(listings: Listing[], filters: Partial<ListingFilters>, user?: User): Listing[] {
  let result = listings.map(refreshListingComputed);

  if (filters.mine && user?.role === 'DONOR') {
    result = result.filter((l) => l.donorId === user.id);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.medicine.name.toLowerCase().includes(q) ||
        l.medicine.genericName.toLowerCase().includes(q) ||
        l.donorName.toLowerCase().includes(q),
    );
  }

  if (filters.urgency?.length) {
    result = result.filter((l) => filters.urgency?.includes(l.urgency));
  }

  if (filters.category) {
    result = result.filter((l) => l.medicine.category === filters.category);
  }

  if (filters.donorType?.length) {
    result = result.filter((l) => filters.donorType?.includes(l.donorType));
  }

  if (filters.expiryWindow !== undefined) {
    result = result.filter((l) => l.daysRemaining <= filters.expiryWindow!);
  }

  if (filters.maxDistance !== undefined) {
    result = result.filter(
      (l) => (l.location.approximateDistanceKm ?? Infinity) <= filters.maxDistance!,
    );
  }

  result = result.filter((l) => l.status !== 'REMOVED');

  switch (filters.sort) {
    case 'urgency': {
      const order: Record<UrgencyLevel, number> = {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
        EXPIRED: 4,
      };
      result.sort((a, b) => order[a.urgency] - order[b.urgency]);
      break;
    }
    case 'distance':
      result.sort(
        (a, b) =>
          (a.location.approximateDistanceKm ?? 999) - (b.location.approximateDistanceKm ?? 999),
      );
      break;
    case 'newest':
    default:
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  return result;
}

function parseListingFilters(url: URL): ListingFilters {
  const urgency = url.searchParams.getAll('urgency[]').length
    ? url.searchParams.getAll('urgency[]')
    : url.searchParams.get('urgency')?.split(',') ?? [];

  const donorType = url.searchParams.getAll('donorType[]').length
    ? url.searchParams.getAll('donorType[]')
    : url.searchParams.get('donorType')?.split(',') ?? [];

  return {
    search: url.searchParams.get('search') ?? undefined,
    urgency: urgency.length ? (urgency as UrgencyLevel[]) : undefined,
    category: url.searchParams.get('category') ?? undefined,
    donorType: donorType.length ? (donorType as DonorType[]) : undefined,
    expiryWindow: url.searchParams.get('expiryWindow')
      ? Number(url.searchParams.get('expiryWindow'))
      : undefined,
    maxDistance: url.searchParams.get('maxDistance')
      ? Number(url.searchParams.get('maxDistance'))
      : undefined,
    sort: (url.searchParams.get('sort') as ListingFilters['sort']) ?? undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : 1,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 12,
    mine: url.searchParams.get('mine') === 'true',
  };
}

function filterClaimsForUser(claims: Claim[], user: User): Claim[] {
  if (user.role === 'ADMIN') return claims;
  if (user.role === 'DONOR') {
    const donorListingIds = new Set(
      state.listings.filter((l) => l.donorId === user.id).map((l) => l.id),
    );
    return claims.filter((c) => donorListingIds.has(c.listingId));
  }
  return claims.filter((c) => c.recipientId === user.id);
}

function filterNeedsForUser(needs: typeof state.needs, user: User) {
  if (user.role === 'ADMIN') return needs;
  return needs.filter((n) => n.recipientId === user.id);
}

function computeAdminDashboardStats(): {
  totalUsers: number;
  pendingVerifications: number;
  activeListings: number;
  pendingClaims: number;
  reports: number;
  completedTransfers: number;
} {
  return {
    totalUsers: state.users.length,
    pendingVerifications: state.verifications.filter((v) => v.status === 'PENDING').length,
    activeListings: state.listings.filter(
      (l) => l.status === 'ACTIVE' || l.status === 'CLAIM_PENDING',
    ).length,
    pendingClaims: state.claims.filter((c) => c.status === 'PENDING').length,
    reports: state.reports.filter((r) => r.status === 'OPEN').length,
    completedTransfers: state.listings.filter((l) => l.status === 'COMPLETED').length,
  };
}

function computeImpactAnalytics() {
  const completedClaims = state.claims.filter((c) => c.status === 'COMPLETED');
  const claimedQuantities = completedClaims.reduce((sum, c) => sum + c.requestedQuantity, 0);
  const expiredListings = state.listings.filter((l) => l.status === 'EXPIRED');
  const expiredQuantities = expiredListings.reduce((sum, l) => sum + l.quantity, 0);
  const totalQuantity = state.listings.reduce((sum, l) => sum + l.quantity, 0);

  return {
    totalListings: state.listings.length,
    activeListings: state.listings.filter((l) => l.status === 'ACTIVE' || l.status === 'CLAIM_PENDING').length,
    completedTransfers: completedClaims.length,
    expiredListings: expiredListings.length,
    claimedQuantities,
    expiredQuantities,
    verifiedOrganizations: state.verifications.filter((v) => v.status === 'APPROVED').length,
    averageTimeToClaimHours: 18.5,
    averageCompletionTimeHours: 42,
    wastePreventionRate: totalQuantity > 0 ? Math.round((claimedQuantities / totalQuantity) * 100) : 0,
  };
}

interface ListingFilters {
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

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  _refreshToken: string;
}

app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const user = state.users.find((u) => u.email === email && u.password === password);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const response = authResponse(user);
  setRefreshCookie(res, response._refreshToken);
  addAuditLog('USER_LOGIN', user, 'auth');
  const { _refreshToken, ...body } = response;
  return res.json(body);
});

app.post(`${API_PREFIX}/auth/register`, (req, res) => {
  const payload = req.body as RegisterData;
  if (state.users.some((u) => u.email === payload.email)) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const newUser: User = {
    id: generateId('user'),
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: payload.role,
    donorType: payload.role === 'DONOR' ? payload.donorType : undefined,
    organizationName: payload.role === 'RECIPIENT' ? payload.organizationName : undefined,
    organizationType: payload.role === 'RECIPIENT' ? payload.organizationType : undefined,
    verificationStatus: payload.role === 'RECIPIENT' ? 'PENDING' : undefined,
    isActive: true,
    createdAt: isoNow(),
  };

  state.users.push(newUser);
  const response = authResponse(newUser);
  setRefreshCookie(res, response._refreshToken);
  addAuditLog('USER_REGISTER', newUser, 'auth');
  const { _refreshToken, ...body } = response;
  return res.status(201).json(body);
});

app.post(`${API_PREFIX}/auth/refresh`, (req, res) => {
  const refreshToken = req.cookies?.medbridge_refresh;
  const userId = refreshToken ? state.refreshTokens.get(refreshToken) : undefined;
  const user = userId ? state.users.find((u) => u.id === userId) : undefined;
  if (!user) {
    return res.status(401).json({ message: 'Session expired' });
  }
  const response = authResponse(user);
  setRefreshCookie(res, response._refreshToken);
  const { _refreshToken, ...body } = response;
  return res.json(body);
});

app.post(`${API_PREFIX}/auth/logout`, (req, res) => {
  const token = getBearerToken(req);
  if (token) state.accessTokens.delete(token);
  const refreshToken = req.cookies?.medbridge_refresh;
  if (refreshToken) state.refreshTokens.delete(refreshToken);
  clearRefreshCookie(res);
  return res.json(null);
});

app.post(`${API_PREFIX}/auth/forgot-password`, (req, res) => {
  const { email } = req.body as { email?: string };
  const user = state.users.find((u) => u.email === email);
  if (user) {
    state.resetTokens.set(`reset-${user.id}`, user.id);
  }
  return res.json({ message: 'If the email exists, a reset link has been sent.' });
});

app.post(`${API_PREFIX}/auth/reset-password`, (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  const userId = token ? state.resetTokens.get(token) : undefined;
  const user = userId ? state.users.find((u) => u.id === userId) : undefined;
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }
  user.password = password ?? user.password;
  state.resetTokens.delete(token!);
  return res.json({ message: 'Password reset successful' });
});

app.get(`${API_PREFIX}/me`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  return res.json(toAuthUser(auth));
});

app.get(`${API_PREFIX}/medicines`, (req, res) => {
  const q = String(req.query.q ?? '').toLowerCase();
  const results = state.medicines
    .filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    )
    .map(toSearchResult);
  return res.json(results);
});

app.get(`${API_PREFIX}/medicines/:id`, (req, res) => {
  const medicine = getMedicineById(req.params.id);
  if (!medicine) {
    return res.status(404).json({ message: 'Medicine not found' });
  }
  return res.json(medicine);
});

app.get(`${API_PREFIX}/listings`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
  const filters = parseListingFilters(url);
  const filtered = filterListings(state.listings, filters, auth);
  return res.json(paginate(filtered, filters.page, filters.limit));
});

app.get(`${API_PREFIX}/listings/:id`, (req, res) => {
  const listing = getListingById(req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  return res.json(listing);
});

app.post(`${API_PREFIX}/listings`, upload.single('image'), (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'DONOR') {
    return res.status(403).json({ message: 'Only donors can create listings' });
  }

  const form = req.body as Record<string, string>;
  const medicineId = String(form.medicineId ?? '');
  const medicine = getMedicineById(medicineId);
  if (!medicine) {
    return res.status(400).json({ message: 'Medicine not found' });
  }

  const expiryDate = String(form.expiryDate ?? '');
  const quantity = Number(form.quantity ?? 0);
  const days = daysRemaining(expiryDate);

  const listing: Listing = {
    id: generateId('listing'),
    donorId: auth.id,
    donorName: auth.name,
    donorType: auth.donorType!,
    medicine,
    batchNumber: String(form.batchNumber ?? ''),
    expiryDate,
    daysRemaining: days,
    quantity,
    quantityAvailable: quantity,
    urgency: urgencyFromDays(days),
    packagingCondition: (String(form.packagingCondition ?? 'SEALED_INTACT') as PackagingCondition),
    storageConfirmed: form.storageConfirmed === 'true',
    location: {
      city: String(form.city ?? ''),
      state: String(form.state ?? ''),
      postalCode: String(form.postalCode ?? ''),
      approximateDistanceKm: 5,
    },
    status: 'ACTIVE',
    eligibilityScreeningPassed: true,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  };

  state.listings.unshift(listing);
  addAuditLog('LISTING_CREATED', auth, listing.id);
  return res.status(201).json(refreshListingComputed(listing));
});

app.patch(`${API_PREFIX}/listings/:id`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  const index = state.listings.findIndex((l) => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  const listing = state.listings[index];
  if (listing.donorId !== auth.id && auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const payload = req.body as Partial<CreateListingPayload>;
  if (payload.expiryDate) {
    listing.expiryDate = payload.expiryDate;
    listing.daysRemaining = daysRemaining(payload.expiryDate);
    listing.urgency = urgencyFromDays(listing.daysRemaining);
  }
  if (payload.quantity !== undefined) {
    const diff = payload.quantity - listing.quantity;
    listing.quantity = payload.quantity;
    listing.quantityAvailable = Math.max(0, listing.quantityAvailable + diff);
  }
  if (payload.batchNumber) listing.batchNumber = payload.batchNumber;
  if (payload.packagingCondition) listing.packagingCondition = payload.packagingCondition;
  if (payload.storageConfirmed !== undefined) listing.storageConfirmed = payload.storageConfirmed;
  if (payload.city) listing.location.city = payload.city;
  if (payload.state) listing.location.state = payload.state;
  if (payload.postalCode) listing.location.postalCode = payload.postalCode;
  listing.updatedAt = isoNow();

  return res.json(refreshListingComputed(listing));
});

app.delete(`${API_PREFIX}/listings/:id`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const listing = state.listings.find((l) => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  if (listing.donorId !== auth.id && auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  listing.status = 'REMOVED';
  listing.updatedAt = isoNow();
  return res.sendStatus(204);
});

app.post(`${API_PREFIX}/listings/:id/report`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const listing = getListingById(req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  const { reason } = req.body as { reason?: string };
  const report: ReportEntry = {
    id: generateId('report'),
    listingId: listing.id,
    listingTitle: `${listing.medicine.name} ${listing.medicine.strength} (${listing.medicine.dosageForm})`,
    reason: reason ?? 'No reason provided',
    reporterName: auth.organizationName ?? auth.name,
    status: 'OPEN',
    createdAt: isoNow(),
  };
  state.reports.unshift(report);
  addAuditLog('LISTING_REPORTED', auth, report.id);
  state.users
    .filter((u) => u.role === 'ADMIN')
    .forEach((admin) =>
      addNotification(admin.id, {
        type: 'REPORT_CREATED',
        title: 'New listing report',
        message: `Listing "${report.listingTitle}" was reported.`,
        link: '/admin/reports',
      }),
    );
  return res.status(201).json(null);
});

app.get(`${API_PREFIX}/claims`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const status = String(req.query.status ?? '');
  const page = Number(req.query.page ?? 1);
  let claims = filterClaimsForUser(state.claims, auth);
  if (status) claims = claims.filter((c) => c.status === status);
  claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(paginate(claims, page, 12));
});

app.get(`${API_PREFIX}/claims/:id`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const claim = state.claims.find((c) => c.id === req.params.id);
  if (!claim) {
    return res.status(404).json({ message: 'Claim not found' });
  }
  const visible = filterClaimsForUser([claim], auth);
  if (!visible.length) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(claim);
});

app.post(`${API_PREFIX}/claims`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'RECIPIENT') {
    return res.status(403).json({ message: 'Only recipients can create claims' });
  }
  if (auth.verificationStatus !== 'APPROVED') {
    return res.status(403).json({ message: 'Recipient verification required' });
  }

  const payload = req.body as CreateClaimPayload;
  const listingIndex = state.listings.findIndex((l) => l.id === payload.listingId);
  if (listingIndex === -1) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  const listing = state.listings[listingIndex];
  if (listing.status !== 'ACTIVE' && listing.status !== 'CLAIM_PENDING') {
    return res.status(400).json({ message: 'Listing is not available for claims' });
  }
  if (payload.requestedQuantity > listing.quantityAvailable) {
    return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
  }

  const claim: Claim = {
    id: generateId('claim'),
    listingId: listing.id,
    recipientId: auth.id,
    recipientOrganization: auth.organizationName ?? auth.name,
    recipientVerificationStatus: auth.verificationStatus ?? 'PENDING',
    medicine: listing.medicine,
    requestedQuantity: payload.requestedQuantity,
    availableQuantity: listing.quantityAvailable,
    donorType: listing.donorType,
    status: 'PENDING',
    createdAt: isoNow(),
  };

  state.claims.unshift(claim);
  listing.quantityAvailable -= payload.requestedQuantity;
  listing.status = 'CLAIM_PENDING';
  listing.updatedAt = isoNow();

  const donor = state.users.find((u) => u.id === listing.donorId);
  if (donor) {
    addNotification(donor.id, {
      type: 'CLAIM_REQUEST',
      title: 'New claim request',
      message: `${claim.recipientOrganization} requested ${claim.requestedQuantity} units of ${listing.medicine.name} ${listing.medicine.strength}.`,
      link: '/donor/claims',
    });
  }
  addAuditLog('CLAIM_CREATED', auth, claim.id);
  return res.status(201).json(claim);
});

app.patch(`${API_PREFIX}/claims/:id/confirm`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const claim = state.claims.find((c) => c.id === req.params.id);
  if (!claim) {
    return res.status(404).json({ message: 'Claim not found' });
  }
  const listing = state.listings.find((l) => l.id === claim.listingId);
  if (!listing || (listing.donorId !== auth.id && auth.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (claim.status !== 'PENDING') {
    return res.status(400).json({ message: 'Only pending claims can be confirmed' });
  }

  claim.status = 'CONFIRMED';
  claim.confirmedAt = isoNow();
//   listing.status = 'CLAIMED';
  listing.updatedAt = isoNow();

  addNotification(claim.recipientId, {
    type: 'CLAIM_CONFIRMED',
    title: 'Claim confirmed',
    message: `${listing.donorName} confirmed your claim for ${claim.requestedQuantity} units.`,
    link: '/recipient/claims',
  });
  addAuditLog('CLAIM_CONFIRMED', auth, claim.id);
  return res.json(claim);
});

app.patch(`${API_PREFIX}/claims/:id/cancel`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const claim = state.claims.find((c) => c.id === req.params.id);
  if (!claim) {
    return res.status(404).json({ message: 'Claim not found' });
  }
  const listing = state.listings.find((l) => l.id === claim.listingId);
  const isDonor = listing?.donorId === auth.id;
  const isRecipient = claim.recipientId === auth.id;
  if (!isDonor && !isRecipient && auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (claim.status === 'COMPLETED' || claim.status === 'CANCELLED') {
    return res.status(400).json({ message: 'Claim cannot be cancelled' });
  }

  claim.status = 'CANCELLED';
  claim.cancelledAt = isoNow();
  if (listing) {
    listing.quantityAvailable += claim.requestedQuantity;
    listing.status = listing.quantityAvailable > 0 ? 'ACTIVE' : listing.status;
    listing.updatedAt = isoNow();
  }

  const notifyUserId = isDonor ? claim.recipientId : listing?.donorId;
  if (notifyUserId) {
    addNotification(notifyUserId, {
      type: 'CLAIM_CANCELLED',
      title: 'Claim cancelled',
      message: `Claim for ${claim.medicine.name} ${claim.medicine.strength} was cancelled.`,
      link: isDonor ? '/recipient/claims' : '/donor/claims',
    });
  }
  addAuditLog('CLAIM_CANCELLED', auth, claim.id);
  return res.json(claim);
});

app.patch(`${API_PREFIX}/claims/:id/complete`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const claim = state.claims.find((c) => c.id === req.params.id);
  if (!claim) {
    return res.status(404).json({ message: 'Claim not found' });
  }
  const listing = state.listings.find((l) => l.id === claim.listingId);
  if (!listing || (listing.donorId !== auth.id && auth.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (claim.status !== 'CONFIRMED') {
    return res.status(400).json({ message: 'Only confirmed claims can be completed' });
  }

  claim.status = 'COMPLETED';
  claim.completedAt = isoNow();
  if (listing.quantityAvailable === 0) {
    listing.status = 'COMPLETED';
  }
  listing.updatedAt = isoNow();
  addAuditLog('CLAIM_COMPLETED', auth, claim.id);
  return res.json(claim);
});

app.get(`${API_PREFIX}/needs`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const page = Number(req.query.page ?? 1);
  return res.json(paginate(filterNeedsForUser(state.needs, auth), page, 12));
});

app.get(`${API_PREFIX}/needs/:id`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const need = state.needs.find((n) => n.id === req.params.id);
  if (!need) {
    return res.status(404).json({ message: 'Need not found' });
  }
  if (auth.role !== 'ADMIN' && need.recipientId !== auth.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(need);
});

app.post(`${API_PREFIX}/needs`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'RECIPIENT') {
    return res.status(403).json({ message: 'Only recipients can create needs' });
  }

  const payload = req.body as CreateNeedPayload;
  const medicine = getMedicineById(payload.medicineId);
  if (!medicine) {
    return res.status(400).json({ message: 'Medicine not found' });
  }

  const need = {
    id: generateId('need'),
    recipientId: auth.id,
    medicine,
    quantityNeeded: payload.quantityNeeded,
    urgency: payload.urgency,
    location: { city: payload.city, state: payload.state },
    description: payload.description,
    status: 'ACTIVE' as const,
    matchCount: 0,
    expiresAt: payload.expiresAt,
    createdAt: isoNow(),
  };

  state.needs.unshift(need);
  addAuditLog('NEED_CREATED', auth, need.id);
  return res.status(201).json(need);
});

app.patch(`${API_PREFIX}/needs/:id`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const need = state.needs.find((n) => n.id === req.params.id);
  if (!need) {
    return res.status(404).json({ message: 'Need not found' });
  }
  if (need.recipientId !== auth.id && auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const payload = req.body as Partial<CreateNeedPayload>;
  if (payload.quantityNeeded !== undefined) need.quantityNeeded = payload.quantityNeeded;
  if (payload.urgency) need.urgency = payload.urgency;
  if (payload.city) need.location.city = payload.city;
  if (payload.state) need.location.state = payload.state;
  if (payload.description !== undefined) need.description = payload.description;
  if (payload.expiresAt) need.expiresAt = payload.expiresAt;
  return res.json(need);
});

app.delete(`${API_PREFIX}/needs/:id`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const need = state.needs.find((n) => n.id === req.params.id);
  if (!need) {
    return res.status(404).json({ message: 'Need not found' });
  }
  if (need.recipientId !== auth.id && auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  need.status = 'CANCELLED';
  return res.sendStatus(204);
});

app.get(`${API_PREFIX}/notifications`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const userNotifications = state.notifications
    .filter((n) => n.userId === auth.id)
    .map(({ userId, ...notification }) => notification)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = userNotifications.filter((n) => !n.read).length;
  return res.json({ data: userNotifications, total: userNotifications.length, unreadCount });
});

app.patch(`${API_PREFIX}/notifications/:id/read`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const notification = state.notifications.find(
    (n) => n.id === req.params.id && n.userId === auth.id,
  );
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  notification.read = true;
  const { userId, ...body } = notification;
  return res.json(body);
});

app.post(`${API_PREFIX}/notifications/read-all`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  state.notifications.filter((n) => n.userId === auth.id).forEach((n) => {
    n.read = true;
  });
  return res.json(null);
});

app.get(`${API_PREFIX}/recipients/verification`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'RECIPIENT') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const verification = state.verifications.find((v) => v.recipientId === auth.id) ?? null;
  return res.json(verification);
});

app.post(
  `${API_PREFIX}/recipients/verification`,
  upload.single('document'),
  (req, res) => {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (auth.role !== 'RECIPIENT') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const form = req.body as Record<string, string>;
    const registrationNumber = String(form.registrationNumber ?? '');
    const document = req.file;
    const documentName = document?.originalname ?? 'document.pdf';

    const existing = state.verifications.find((v) => v.recipientId === auth.id);
    if (existing) {
      existing.registrationNumber = registrationNumber;
      existing.documentName = documentName;
      existing.documentUrl = `/mock/documents/${documentName}`;
      existing.status = 'PENDING';
      existing.submittedAt = isoNow();
      existing.reviewedAt = undefined;
      existing.rejectionReason = undefined;
      addAuditLog('VERIFICATION_RESUBMITTED', auth, existing.id);
      return res.json(existing);
    }

    const verification: VerificationSubmission = {
      id: generateId('verification'),
      recipientId: auth.id,
      organizationName: auth.organizationName ?? auth.name,
      organizationType: auth.organizationType!,
      registrationNumber,
      status: 'PENDING',
      documentUrl: `/mock/documents/${documentName}`,
      documentName,
      submittedAt: isoNow(),
    };
    state.verifications.push(verification);
    auth.verificationStatus = 'PENDING';
    addAuditLog('VERIFICATION_SUBMITTED', auth, verification.id);
    return res.status(201).json(verification);
  },
);

app.get(`${API_PREFIX}/admin/dashboard`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(computeAdminDashboardStats());
});

app.get(`${API_PREFIX}/admin/verifications`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(state.verifications);
});

app.get(`${API_PREFIX}/admin/verifications/:id`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const verification = state.verifications.find((v) => v.id === req.params.id);
  if (!verification) {
    return res.status(404).json({ message: 'Verification not found' });
  }
  return res.json(verification);
});

app.patch(`${API_PREFIX}/admin/recipients/:id/approve`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const recipientId = req.params.id;
  const user = state.users.find((u) => u.id === recipientId);
  const verification = state.verifications.find((v) => v.recipientId === recipientId);
  if (!user || !verification) {
    return res.status(404).json({ message: 'Recipient not found' });
  }
  user.verificationStatus = 'APPROVED';
  verification.status = 'APPROVED';
  verification.reviewedAt = isoNow();
  verification.rejectionReason = undefined;
  addNotification(recipientId, {
    type: 'VERIFICATION_APPROVED',
    title: 'Verification approved',
    message: `${verification.organizationName} has been verified.`,
    link: '/recipient/verification',
  });
  addAuditLog('VERIFICATION_APPROVED', auth, verification.id);
  return res.json(null);
});

app.patch(`${API_PREFIX}/admin/recipients/:id/reject`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { reason } = req.body as { reason?: string };
  const recipientId = req.params.id;
  const user = state.users.find((u) => u.id === recipientId);
  const verification = state.verifications.find((v) => v.recipientId === recipientId);
  if (!user || !verification) {
    return res.status(404).json({ message: 'Recipient not found' });
  }
  user.verificationStatus = 'REJECTED';
  verification.status = 'REJECTED';
  verification.reviewedAt = isoNow();
  verification.rejectionReason = reason;
  addNotification(recipientId, {
    type: 'VERIFICATION_REJECTED',
    title: 'Verification rejected',
    message: reason ?? 'Your verification request was rejected.',
    link: '/recipient/verification',
  });
  addAuditLog('VERIFICATION_REJECTED', auth, verification.id);
  return res.json(null);
});

app.get(`${API_PREFIX}/admin/reports`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(state.reports);
});

app.patch(`${API_PREFIX}/admin/reports/:id/resolve`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const report = state.reports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }
  report.status = 'RESOLVED';
  addAuditLog('REPORT_RESOLVED', auth, report.id);
  return res.json(null);
});

app.get(`${API_PREFIX}/admin/audit-logs`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const event = String(req.query.event ?? '');
  const page = Number(req.query.page ?? 1);
  let logs = [...state.auditLogs];
  if (event) logs = logs.filter((l) => l.event === event);
  return res.json({ data: paginate(logs, page, 20).data, total: logs.length });
});

app.get(`${API_PREFIX}/admin/users`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(state.users.map(({ password, ...user }) => user));
});

app.get(`${API_PREFIX}/admin/listings`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(paginate(state.listings.map(refreshListingComputed), 1, 100));
});

app.get(`${API_PREFIX}/admin/analytics`, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(computeImpactAnalytics());
});

app.listen(PORT, () => {
  console.log(`MedBridge backend listening on http://localhost:${PORT}${API_PREFIX}`);
});
