import { useState } from 'react';
import { Building2, Mail, MapPin, Pencil, Phone, User } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { useAuth } from '@/hooks/useAuth';

export function RecipientProfilePage() {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!user) return null;

  const fullLocation = [user.address, user.city, user.state, user.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <PageHeader
          title="Recipient Organization Profile"
          subtitle="Manage your organization credentials, representative details, and contact numbers"
          className="mb-0"
        />
        <Button
          onClick={() => setIsEditOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Pencil className="size-4" /> Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Profile Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
          {/* Header Avatar & Name */}
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-border flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl border border-primary/20">
                <Building2 className="size-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  {user.organizationName || user.name}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Representative: <span className="font-semibold text-text-primary">{user.name}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <span className="text-xs text-text-muted">Verification Status</span>
              <StatusBadge status={user.verificationStatus ?? 'PENDING'} />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <User className="size-3.5 text-primary" /> Representative Name
              </span>
              <p className="font-bold text-text-primary mt-0.5">{user.name}</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Phone className="size-3.5 text-emerald-500" /> Mobile / Phone Number
              </span>
              <p className="font-bold text-text-primary mt-0.5">{user.phone || 'Not specified'}</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" /> Registered Email Address
              </span>
              <p className="font-medium text-text-primary mt-0.5 truncate">{user.email}</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Building2 className="size-3.5 text-text-muted" /> Organization Type
              </span>
              <p className="font-semibold text-text-primary mt-0.5 capitalize">
                {user.organizationType?.replace(/_/g, ' ') || 'Healthcare Organization'}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Facility / Delivery Address
              </span>
              <p className="font-medium text-text-primary mt-0.5">
                {fullLocation || 'No physical address specified yet (Click Edit Profile to add)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={user}
      />
    </>
  );
}
