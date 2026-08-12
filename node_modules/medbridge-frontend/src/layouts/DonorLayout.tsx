import { DashboardLayout } from './DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';

export function DonorLayout() {
  return (
    <RoleGuard allowedRoles={['DONOR']}>
      <DashboardLayout allowedRole="DONOR" />
    </RoleGuard>
  );
}
