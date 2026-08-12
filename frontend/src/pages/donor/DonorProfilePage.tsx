import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/utils/roleHelpers';

export function DonorProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <PageHeader title="Profile" subtitle="Your donor account information" />
      <div className="max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <dl className="space-y-4">
          <div><dt className="text-sm text-text-secondary">Name</dt><dd className="font-medium">{user.name}</dd></div>
          <div><dt className="text-sm text-text-secondary">Email</dt><dd className="font-medium">{user.email}</dd></div>
          <div><dt className="text-sm text-text-secondary">Phone</dt><dd className="font-medium">{user.phone}</dd></div>
          <div><dt className="text-sm text-text-secondary">Role</dt><dd className="font-medium">{getRoleLabel(user.role)}</dd></div>
          {user.donorType && (
            <div><dt className="text-sm text-text-secondary">Donor type</dt><dd className="font-medium capitalize">{user.donorType.replace(/_/g, ' ').toLowerCase()}</dd></div>
          )}
        </dl>
      </div>
    </>
  );
}
