import { DashboardLayout } from './DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';

export function RecipientLayout() {
  return (
    <RoleGuard allowedRoles={['RECIPIENT']}>
      <DashboardLayout allowedRole="RECIPIENT" />
    </RoleGuard>
  );
}
