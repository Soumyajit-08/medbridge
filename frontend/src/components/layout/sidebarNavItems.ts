import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  History,
  User,
  Bell,
  Search,
  FileCheck,
  Heart,
  ShieldCheck,
  Flag,
  Users,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import type { UserRole } from '@/types/auth';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function getSidebarNavItems(role: UserRole): SidebarNavItem[] {
  switch (role) {
    case 'DONOR':
      return [
        { label: 'Dashboard', href: ROUTES.donor.dashboard, icon: LayoutDashboard },
        { label: 'My Listings', href: ROUTES.donor.listings, icon: Package },
        { label: 'Create Listing', href: ROUTES.donor.createListing, icon: PlusCircle },
        { label: 'Claim Requests', href: ROUTES.donor.claims, icon: ClipboardList },
        { label: 'History', href: ROUTES.donor.history, icon: History },
        { label: 'Profile', href: ROUTES.donor.profile, icon: User },
        { label: 'Notifications', href: ROUTES.donor.notifications, icon: Bell },
      ];
    case 'RECIPIENT':
      return [
        { label: 'Dashboard', href: ROUTES.recipient.dashboard, icon: LayoutDashboard },
        { label: 'Browse Medicines', href: ROUTES.recipient.medicines, icon: Search },
        { label: 'My Claims', href: ROUTES.recipient.claims, icon: ClipboardList },
        { label: 'My Needs', href: ROUTES.recipient.needs, icon: Heart },
        { label: 'Verification', href: ROUTES.recipient.verification, icon: ShieldCheck },
        { label: 'Profile', href: ROUTES.recipient.profile, icon: User },
        { label: 'Notifications', href: ROUTES.recipient.notifications, icon: Bell },
      ];
    case 'ADMIN':
      return [
        { label: 'Dashboard', href: ROUTES.admin.dashboard, icon: LayoutDashboard },
        { label: 'Verification Queue', href: ROUTES.admin.verifications, icon: FileCheck },
        { label: 'Reports', href: ROUTES.admin.reports, icon: Flag },
        { label: 'Users', href: ROUTES.admin.users, icon: Users },
        { label: 'Listings', href: ROUTES.admin.listings, icon: Package },
        { label: 'Audit Logs', href: ROUTES.admin.auditLogs, icon: ScrollText },
        { label: 'Profile', href: ROUTES.admin.profile, icon: User },
      ];
    default:
      return [];
  }
}
