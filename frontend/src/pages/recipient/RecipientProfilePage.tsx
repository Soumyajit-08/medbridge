import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/utils/roleHelpers';

export function RecipientProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <PageHeader title="Profile" subtitle="Your recipient organization details" />

      <dl className="max-w-lg space-y-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        {[
          ['Name', user.name],
          ['Email', user.email],
          ['Phone', user.phone],
          ['Role', getRoleLabel(user.role)],
          ['Organization', user.organizationName ?? '—'],
          ['Organization type', user.organizationType?.replace(/_/g, ' ') ?? '—'],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-text-primary">{value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Verification status
          </dt>
          <dd className="mt-2">
            <StatusBadge status={user.verificationStatus ?? 'PENDING'} />
          </dd>
        </div>
      </dl>
    </>
  );
}
