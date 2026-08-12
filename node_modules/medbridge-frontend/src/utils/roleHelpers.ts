import type { UserRole } from '@/types/auth';
import { ROUTES } from '@/lib/constants';

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'DONOR':
      return ROUTES.donor.dashboard;
    case 'RECIPIENT':
      return ROUTES.recipient.dashboard;
    case 'ADMIN':
      return ROUTES.admin.dashboard;
    default:
      return ROUTES.home;
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'DONOR':
      return 'Donor';
    case 'RECIPIENT':
      return 'Recipient';
    case 'ADMIN':
      return 'Administrator';
    default:
      return role;
  }
}

export function canAccessRoute(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
