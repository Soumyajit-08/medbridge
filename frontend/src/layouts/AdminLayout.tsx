import { DashboardLayout } from './DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';

export function AdminLayout() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <DashboardLayout allowedRole="ADMIN" />
    </RoleGuard>
  );
}
