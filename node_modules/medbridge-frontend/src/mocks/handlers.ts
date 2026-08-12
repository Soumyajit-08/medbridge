import { http, HttpResponse, type HttpHandler } from 'msw';
import { API_BASE_URL } from '@/lib/constants';
import type { AuthResponse, AuthUser, RegisterData } from '@/types/auth';
import type { Claim, CreateClaimPayload } from '@/types/claim';
import type { CreateListingPayload, Listing, ListingFilters, PaginatedListings } from '@/types/listing';
import type { CreateNeedPayload, Need } from '@/types/need';
import type { Notification, PaginatedNotifications } from '@/types/notification';
import type { VerificationSubmission } from '@/types/verification';
import type { ReportEntry } from '@/types/dashboard';
import { initialUsers, toAuthUser, type MockUser } from './data/users';
import { initialMedicines, toSearchResult } from './data/medicines';
import { initialListings } from './data/listings';
import { initialClaims } from './data/claims';
import { initialNeeds } from './data/needs';
import { initialNotifications, type MockNotification } from './data/notifications';
import { initialVerifications } from './data/verifications';
import {
  computeAdminDashboardStats,
  computeImpactAnalytics,
  initialAuditLogs,
  initialReports,
} from './data/dashboard';
import type { AuditLogEntry } from '@/types/dashboard';
import type { UrgencyLevel } from '@/types/listing';

// ─── In-memory mutable state ───────────────────────────────────────────────

const state = {
  users: structuredClone(initialUsers) as MockUser[],
  medicines: structuredClone(initialMedicines),
  listings: structuredClone(initialListings) as Listing[],
  claims: structuredClone(initialClaims) as Claim[],
  needs: structuredClone(initialNeeds) as Need[],
  notifications: structuredClone(initialNotifications) as MockNotification[],
  verifications: structuredClone(initialVerifications) as VerificationSubmission[],
  reports: structuredClone(initialReports) as ReportEntry[],
  auditLogs: structuredClone(initialAuditLogs) as AuditLogEntry[],
  accessTokens: new Map<string, string>(),
  refreshTokens: new Map<string, string>(),
  resetTokens: new Map<string, string>(),
};

// ─── Helpers ───────────────────────────────────────────────────────────────

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

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function getBearerToken(request: Request): string | undefined {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return undefined;
  return auth.slice(7);
}

function getUserFromRequest(request: Request): MockUser | undefined {
  const token = getBearerToken(request);
  if (token) {
    const userId = state.accessTokens.get(token);
    if (userId) return state.users.find((u) => u.id === userId);
  }
  const refreshToken = getCookie(request, 'medbridge_refresh');
  if (refreshToken) {
    const userId = state.refreshTokens.get(refreshToken);
    if (userId) return state.users.find((u) => u.id === userId);
  }
  return undefined;
}

function requireAuth(request: Request): MockUser | ReturnType<typeof HttpResponse.json> {
  const user = getUserFromRequest(request);
  if (!user) {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
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

function authResponse(user: MockUser): AuthResponse {
  const { accessToken, refreshToken } = createTokens(user.id);
  return {
    user: toAuthUser(user),
    accessToken,
    _refreshToken: refreshToken,
  } as AuthResponse & { _refreshToken: string };
}

function setRefreshCookie(refreshToken: string): Record<string, string> {
  return {
    'Set-Cookie': `medbridge_refresh=${refreshToken}; Path=/; HttpOnly; SameSite=Lax`,
  };
}

function clearRefreshCookie(): Record<string, string> {
  return {
    'Set-Cookie': 'medbridge_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  };
}

function paginate<T>(items: T[], page = 1, limit = 12) {
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

function addAuditLog(event: string, user: MockUser, resource: string) {
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

function addNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>,
) {
  state.notifications.unshift({
    ...notification,
    id: generateId('notif'),
    userId,
    read: false,
    createdAt: isoNow(),
  });
}

function getMedicineById(id: string) {
  return state.medicines.find((m) => m.id === id);
}

function getListingById(id: string) {
  const listing = state.listings.find((l) => l.id === id);
  return listing ? refreshListingComputed(listing) : undefined;
}

function filterListings(listings: Listing[], filters: ListingFilters, user?: MockUser): Listing[] {
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
    result = result.filter((l) => filters.urgency!.includes(l.urgency));
  }

  if (filters.category) {
    result = result.filter((l) => l.medicine.category === filters.category);
  }

  if (filters.donorType?.length) {
    result = result.filter((l) => filters.donorType!.includes(l.donorType));
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

function parseListingFilters(url: URL): ListingFilters & { mine?: boolean } {
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
    donorType: donorType.length ? (donorType as Listing['donorType'][]) : undefined,
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

function filterClaimsForUser(claims: Claim[], user: MockUser): Claim[] {
  if (user.role === 'ADMIN') return claims;
  if (user.role === 'DONOR') {
    const donorListingIds = new Set(
      state.listings.filter((l) => l.donorId === user.id).map((l) => l.id),
    );
    return claims.filter((c) => donorListingIds.has(c.listingId));
  }
  return claims.filter((c) => c.recipientId === user.id);
}

function filterNeedsForUser(needs: Need[], user: MockUser): Need[] {
  if (user.role === 'ADMIN') return needs;
  return needs.filter((n) => n.recipientId === user.id);
}

async function parseJsonBody<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

// ─── Handlers ───────────────────────────────────────────────────────────────

export const handlers: HttpHandler[] = [
  // Auth
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const { email, password } = await parseJsonBody<{ email: string; password: string }>(request);
    const user = state.users.find((u) => u.email === email && u.password === password);
    if (!user || !user.isActive) {
      return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    const response = authResponse(user);
    const { _refreshToken, ...body } = response as AuthResponse & { _refreshToken: string };
    addAuditLog('USER_LOGIN', user, 'auth');
    return HttpResponse.json(body, { headers: setRefreshCookie(_refreshToken) });
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const payload = await parseJsonBody<RegisterData>(request);
    if (state.users.some((u) => u.email === payload.email)) {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 409 });
    }
    const newUser: MockUser = {
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
    const { _refreshToken, ...body } = response as AuthResponse & { _refreshToken: string };
    addAuditLog('USER_REGISTER', newUser, 'auth');
    return HttpResponse.json(body, { status: 201, headers: setRefreshCookie(_refreshToken) });
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, ({ request }) => {
    const refreshToken = getCookie(request, 'medbridge_refresh');
    const userId = refreshToken ? state.refreshTokens.get(refreshToken) : undefined;
    const user = userId ? state.users.find((u) => u.id === userId) : undefined;
    if (!user) {
      return HttpResponse.json({ message: 'Session expired' }, { status: 401 });
    }
    const response = authResponse(user);
    const { _refreshToken, ...body } = response as AuthResponse & { _refreshToken: string };
    return HttpResponse.json(body, { headers: setRefreshCookie(_refreshToken) });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, ({ request }) => {
    const token = getBearerToken(request);
    if (token) state.accessTokens.delete(token);
    const refreshToken = getCookie(request, 'medbridge_refresh');
    if (refreshToken) state.refreshTokens.delete(refreshToken);
    return HttpResponse.json(null, { headers: clearRefreshCookie() });
  }),

  http.post(`${API_BASE_URL}/auth/forgot-password`, async ({ request }) => {
    const { email } = await parseJsonBody<{ email: string }>(request);
    const user = state.users.find((u) => u.email === email);
    if (user) {
      state.resetTokens.set(`reset-${user.id}`, user.id);
    }
    return HttpResponse.json({ message: 'If the email exists, a reset link has been sent.' });
  }),

  http.post(`${API_BASE_URL}/auth/reset-password`, async ({ request }) => {
    const { token, password } = await parseJsonBody<{ token: string; password: string }>(request);
    const userId = state.resetTokens.get(token);
    const user = userId ? state.users.find((u) => u.id === userId) : undefined;
    if (!user) {
      return HttpResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 });
    }
    user.password = password;
    state.resetTokens.delete(token);
    return HttpResponse.json({ message: 'Password reset successful' });
  }),

  http.get(`${API_BASE_URL}/me`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    return HttpResponse.json(toAuthUser(auth) satisfies AuthUser);
  }),

  // Medicines
  http.get(`${API_BASE_URL}/medicines`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const results = state.medicines
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q),
      )
      .map(toSearchResult);
    return HttpResponse.json(results);
  }),

  http.get(`${API_BASE_URL}/medicines/:id`, ({ params }) => {
    const medicine = getMedicineById(params.id as string);
    if (!medicine) {
      return HttpResponse.json({ message: 'Medicine not found' }, { status: 404 });
    }
    return HttpResponse.json(medicine);
  }),

  // Listings
  http.get(`${API_BASE_URL}/listings`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const url = new URL(request.url);
    const filters = parseListingFilters(url);
    const filtered = filterListings(state.listings, filters, auth);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    return HttpResponse.json(paginate(filtered, page, limit) satisfies PaginatedListings);
  }),

  http.get(`${API_BASE_URL}/listings/:id`, ({ params }) => {
    const listing = getListingById(params.id as string);
    if (!listing) {
      return HttpResponse.json({ message: 'Listing not found' }, { status: 404 });
    }
    return HttpResponse.json(listing);
  }),

  http.post(`${API_BASE_URL}/listings`, async ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'DONOR') {
      return HttpResponse.json({ message: 'Only donors can create listings' }, { status: 403 });
    }

    const formData = await request.formData();
    const medicineId = String(formData.get('medicineId') ?? '');
    const medicine = getMedicineById(medicineId);
    if (!medicine) {
      return HttpResponse.json({ message: 'Medicine not found' }, { status: 400 });
    }

    const expiryDate = String(formData.get('expiryDate') ?? '');
    const quantity = Number(formData.get('quantity') ?? 0);
    const days = daysRemaining(expiryDate);

    const listing: Listing = {
      id: generateId('listing'),
      donorId: auth.id,
      donorName: auth.name,
      donorType: auth.donorType!,
      medicine,
      batchNumber: String(formData.get('batchNumber') ?? ''),
      expiryDate,
      daysRemaining: days,
      quantity,
      quantityAvailable: quantity,
      urgency: urgencyFromDays(days),
      packagingCondition: String(formData.get('packagingCondition') ?? 'SEALED_INTACT') as Listing['packagingCondition'],
      storageConfirmed: formData.get('storageConfirmed') === 'true',
      location: {
        city: String(formData.get('city') ?? ''),
        state: String(formData.get('state') ?? ''),
        postalCode: String(formData.get('postalCode') ?? ''),
        approximateDistanceKm: 5,
      },
      status: 'ACTIVE',
      eligibilityScreeningPassed: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };

    state.listings.unshift(listing);
    addAuditLog('LISTING_CREATED', auth, listing.id);
    return HttpResponse.json(refreshListingComputed(listing), { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/listings/:id`, async ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const index = state.listings.findIndex((l) => l.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Listing not found' }, { status: 404 });
    }
    const listing = state.listings[index];
    if (listing.donorId !== auth.id && auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const payload = await parseJsonBody<Partial<CreateListingPayload>>(request);
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

    return HttpResponse.json(refreshListingComputed(listing));
  }),

  http.delete(`${API_BASE_URL}/listings/:id`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const listing = state.listings.find((l) => l.id === params.id);
    if (!listing) {
      return HttpResponse.json({ message: 'Listing not found' }, { status: 404 });
    }
    if (listing.donorId !== auth.id && auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    listing.status = 'REMOVED';
    listing.updatedAt = isoNow();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API_BASE_URL}/listings/:id/report`, async ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const listing = getListingById(params.id as string);
    if (!listing) {
      return HttpResponse.json({ message: 'Listing not found' }, { status: 404 });
    }
    const { reason } = await parseJsonBody<{ reason: string }>(request);
    const report: ReportEntry = {
      id: generateId('report'),
      listingId: listing.id,
      listingTitle: `${listing.medicine.name} ${listing.medicine.strength} (${listing.medicine.dosageForm})`,
      reason,
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
    return HttpResponse.json(null, { status: 201 });
  }),

  // Claims
  http.get(`${API_BASE_URL}/claims`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? undefined;
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = 12;

    let claims = filterClaimsForUser(state.claims, auth);
    if (status) claims = claims.filter((c) => c.status === status);
    claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return HttpResponse.json(paginate(claims, page, limit));
  }),

  http.get(`${API_BASE_URL}/claims/:id`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const claim = state.claims.find((c) => c.id === params.id);
    if (!claim) {
      return HttpResponse.json({ message: 'Claim not found' }, { status: 404 });
    }
    const visible = filterClaimsForUser([claim], auth);
    if (!visible.length) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return HttpResponse.json(claim);
  }),

  http.post(`${API_BASE_URL}/claims`, async ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'RECIPIENT') {
      return HttpResponse.json({ message: 'Only recipients can create claims' }, { status: 403 });
    }
    if (auth.verificationStatus !== 'APPROVED') {
      return HttpResponse.json({ message: 'Recipient verification required' }, { status: 403 });
    }

    const payload = await parseJsonBody<CreateClaimPayload>(request);
    const listingIndex = state.listings.findIndex((l) => l.id === payload.listingId);
    if (listingIndex === -1) {
      return HttpResponse.json({ message: 'Listing not found' }, { status: 404 });
    }
    const listing = state.listings[listingIndex];
    if (listing.status !== 'ACTIVE' && listing.status !== 'CLAIM_PENDING') {
      return HttpResponse.json({ message: 'Listing is not available for claims' }, { status: 400 });
    }
    if (payload.requestedQuantity > listing.quantityAvailable) {
      return HttpResponse.json({ message: 'Requested quantity exceeds available stock' }, { status: 400 });
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
    return HttpResponse.json(claim, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/claims/:id/confirm`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const claim = state.claims.find((c) => c.id === params.id);
    if (!claim) {
      return HttpResponse.json({ message: 'Claim not found' }, { status: 404 });
    }
    const listing = state.listings.find((l) => l.id === claim.listingId);
    if (!listing || (listing.donorId !== auth.id && auth.role !== 'ADMIN')) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (claim.status !== 'PENDING') {
      return HttpResponse.json({ message: 'Only pending claims can be confirmed' }, { status: 400 });
    }

    claim.status = 'CONFIRMED';
    claim.confirmedAt = isoNow();
    listing.status = 'CLAIMED';
    listing.updatedAt = isoNow();

    addNotification(claim.recipientId, {
      type: 'CLAIM_CONFIRMED',
      title: 'Claim confirmed',
      message: `${listing.donorName} confirmed your claim for ${claim.requestedQuantity} units.`,
      link: '/recipient/claims',
    });
    addAuditLog('CLAIM_CONFIRMED', auth, claim.id);
    return HttpResponse.json(claim);
  }),

  http.patch(`${API_BASE_URL}/claims/:id/cancel`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const claim = state.claims.find((c) => c.id === params.id);
    if (!claim) {
      return HttpResponse.json({ message: 'Claim not found' }, { status: 404 });
    }
    const listing = state.listings.find((l) => l.id === claim.listingId);
    const isDonor = listing?.donorId === auth.id;
    const isRecipient = claim.recipientId === auth.id;
    if (!isDonor && !isRecipient && auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (claim.status === 'COMPLETED' || claim.status === 'CANCELLED') {
      return HttpResponse.json({ message: 'Claim cannot be cancelled' }, { status: 400 });
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
    return HttpResponse.json(claim);
  }),

  http.patch(`${API_BASE_URL}/claims/:id/complete`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const claim = state.claims.find((c) => c.id === params.id);
    if (!claim) {
      return HttpResponse.json({ message: 'Claim not found' }, { status: 404 });
    }
    const listing = state.listings.find((l) => l.id === claim.listingId);
    if (!listing || (listing.donorId !== auth.id && auth.role !== 'ADMIN')) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (claim.status !== 'CONFIRMED') {
      return HttpResponse.json({ message: 'Only confirmed claims can be completed' }, { status: 400 });
    }

    claim.status = 'COMPLETED';
    claim.completedAt = isoNow();
    if (listing.quantityAvailable === 0) {
      listing.status = 'COMPLETED';
    }
    listing.updatedAt = isoNow();
    addAuditLog('CLAIM_COMPLETED', auth, claim.id);
    return HttpResponse.json(claim);
  }),

  // Needs
  http.get(`${API_BASE_URL}/needs`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const needs = filterNeedsForUser(state.needs, auth);
    return HttpResponse.json(paginate(needs, page, 12));
  }),

  http.get(`${API_BASE_URL}/needs/:id`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const need = state.needs.find((n) => n.id === params.id);
    if (!need) {
      return HttpResponse.json({ message: 'Need not found' }, { status: 404 });
    }
    if (auth.role !== 'ADMIN' && need.recipientId !== auth.id) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return HttpResponse.json(need);
  }),

  http.post(`${API_BASE_URL}/needs`, async ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'RECIPIENT') {
      return HttpResponse.json({ message: 'Only recipients can create needs' }, { status: 403 });
    }
    const payload = await parseJsonBody<CreateNeedPayload>(request);
    const medicine = getMedicineById(payload.medicineId);
    if (!medicine) {
      return HttpResponse.json({ message: 'Medicine not found' }, { status: 400 });
    }

    const need: Need = {
      id: generateId('need'),
      recipientId: auth.id,
      medicine,
      quantityNeeded: payload.quantityNeeded,
      urgency: payload.urgency,
      location: { city: payload.city, state: payload.state },
      description: payload.description,
      status: 'ACTIVE',
      matchCount: 0,
      expiresAt: payload.expiresAt,
      createdAt: isoNow(),
    };
    state.needs.unshift(need);
    addAuditLog('NEED_CREATED', auth, need.id);
    return HttpResponse.json(need, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/needs/:id`, async ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const need = state.needs.find((n) => n.id === params.id);
    if (!need) {
      return HttpResponse.json({ message: 'Need not found' }, { status: 404 });
    }
    if (need.recipientId !== auth.id && auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const payload = await parseJsonBody<Partial<CreateNeedPayload>>(request);
    if (payload.quantityNeeded !== undefined) need.quantityNeeded = payload.quantityNeeded;
    if (payload.urgency) need.urgency = payload.urgency;
    if (payload.city) need.location.city = payload.city;
    if (payload.state) need.location.state = payload.state;
    if (payload.description !== undefined) need.description = payload.description;
    if (payload.expiresAt) need.expiresAt = payload.expiresAt;
    return HttpResponse.json(need);
  }),

  http.delete(`${API_BASE_URL}/needs/:id`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const need = state.needs.find((n) => n.id === params.id);
    if (!need) {
      return HttpResponse.json({ message: 'Need not found' }, { status: 404 });
    }
    if (need.recipientId !== auth.id && auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    need.status = 'CANCELLED';
    return new HttpResponse(null, { status: 204 });
  }),

  // Notifications
  http.get(`${API_BASE_URL}/notifications`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const userNotifications = state.notifications
      .filter((n) => n.userId === auth.id)
      .map(({ userId: _, ...notification }) => notification)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = userNotifications.filter((n) => !n.read).length;
    return HttpResponse.json({
      data: userNotifications,
      total: userNotifications.length,
      unreadCount,
    } satisfies PaginatedNotifications);
  }),

  http.patch(`${API_BASE_URL}/notifications/:id/read`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    const notification = state.notifications.find((n) => n.id === params.id && n.userId === auth.id);
    if (!notification) {
      return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    }
    notification.read = true;
    const { userId: _, ...body } = notification;
    return HttpResponse.json(body satisfies Notification);
  }),

  http.post(`${API_BASE_URL}/notifications/read-all`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    state.notifications
      .filter((n) => n.userId === auth.id)
      .forEach((n) => {
        n.read = true;
      });
    return HttpResponse.json(null);
  }),

  // Recipient verification
  http.get(`${API_BASE_URL}/recipients/verification`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'RECIPIENT') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const verification = state.verifications.find((v) => v.recipientId === auth.id) ?? null;
    return HttpResponse.json(verification);
  }),

  http.post(`${API_BASE_URL}/recipients/verification`, async ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'RECIPIENT') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const registrationNumber = String(formData.get('registrationNumber') ?? '');
    const document = formData.get('document');
    const documentName = document instanceof File ? document.name : 'document.pdf';

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
      return HttpResponse.json(existing, { status: 200 });
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
    return HttpResponse.json(verification, { status: 201 });
  }),

  // Admin
  http.get(`${API_BASE_URL}/admin/dashboard`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return HttpResponse.json(
      computeAdminDashboardStats(state.users, state.listings, state.claims, state.verifications, state.reports),
    );
  }),

  http.get(`${API_BASE_URL}/admin/verifications`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return HttpResponse.json(state.verifications);
  }),

  http.get(`${API_BASE_URL}/admin/verifications/:id`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const verification = state.verifications.find((v) => v.id === params.id);
    if (!verification) {
      return HttpResponse.json({ message: 'Verification not found' }, { status: 404 });
    }
    return HttpResponse.json(verification);
  }),

  http.patch(`${API_BASE_URL}/admin/recipients/:id/approve`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const recipientId = params.id as string;
    const user = state.users.find((u) => u.id === recipientId);
    const verification = state.verifications.find((v) => v.recipientId === recipientId);
    if (!user || !verification) {
      return HttpResponse.json({ message: 'Recipient not found' }, { status: 404 });
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
    return HttpResponse.json(null);
  }),

  http.patch(`${API_BASE_URL}/admin/recipients/:id/reject`, async ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { reason } = await parseJsonBody<{ reason: string }>(request);
    const recipientId = params.id as string;
    const user = state.users.find((u) => u.id === recipientId);
    const verification = state.verifications.find((v) => v.recipientId === recipientId);
    if (!user || !verification) {
      return HttpResponse.json({ message: 'Recipient not found' }, { status: 404 });
    }
    user.verificationStatus = 'REJECTED';
    verification.status = 'REJECTED';
    verification.reviewedAt = isoNow();
    verification.rejectionReason = reason;
    addNotification(recipientId, {
      type: 'VERIFICATION_REJECTED',
      title: 'Verification rejected',
      message: reason,
      link: '/recipient/verification',
    });
    addAuditLog('VERIFICATION_REJECTED', auth, verification.id);
    return HttpResponse.json(null);
  }),

  http.get(`${API_BASE_URL}/admin/reports`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return HttpResponse.json(state.reports);
  }),

  http.patch(`${API_BASE_URL}/admin/reports/:id/resolve`, ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const report = state.reports.find((r) => r.id === params.id);
    if (!report) {
      return HttpResponse.json({ message: 'Report not found' }, { status: 404 });
    }
    report.status = 'RESOLVED';
    addAuditLog('REPORT_RESOLVED', auth, report.id);
    return HttpResponse.json(null);
  }),

  http.get(`${API_BASE_URL}/admin/audit-logs`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const url = new URL(request.url);
    const event = url.searchParams.get('event') ?? undefined;
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = 20;
    let logs = [...state.auditLogs];
    if (event) logs = logs.filter((l) => l.event === event);
    const paginated = paginate(logs, page, limit);
    return HttpResponse.json({ data: paginated.data, total: paginated.total });
  }),

  http.get(`${API_BASE_URL}/admin/users`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return HttpResponse.json(
      state.users.map(({ password: _, ...user }) => user),
    );
  }),

  http.get(`${API_BASE_URL}/admin/listings`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const listings = state.listings.map(refreshListingComputed);
    return HttpResponse.json(paginate(listings, 1, 100) satisfies PaginatedListings);
  }),

  http.get(`${API_BASE_URL}/admin/analytics`, ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof HttpResponse) return auth;
    if (auth.role !== 'ADMIN') {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return HttpResponse.json(computeImpactAnalytics(state.listings, state.claims, state.verifications));
  }),
];

export function resetMockState(): void {
  state.users = structuredClone(initialUsers);
  state.medicines = structuredClone(initialMedicines);
  state.listings = structuredClone(initialListings);
  state.claims = structuredClone(initialClaims);
  state.needs = structuredClone(initialNeeds);
  state.notifications = structuredClone(initialNotifications);
  state.verifications = structuredClone(initialVerifications);
  state.reports = structuredClone(initialReports);
  state.auditLogs = structuredClone(initialAuditLogs);
  state.accessTokens.clear();
  state.refreshTokens.clear();
  state.resetTokens.clear();
}
