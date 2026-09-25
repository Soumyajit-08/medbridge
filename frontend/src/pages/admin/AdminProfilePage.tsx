import { useState } from 'react';
import { Mail, MapPin, Pencil, Phone, ShieldCheck, User } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/utils/roleHelpers';

export function AdminProfilePage() {
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
          title="Admin Profile"
          subtitle="Manage your platform administrator account credentials and contact details"
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
          <div className="flex items-center gap-4 pb-6 border-b border-border">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 font-bold text-xl border border-rose-500/20">
              <ShieldCheck className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {getRoleLabel(user.role)}
                </span>
                <span className="text-xs text-text-muted">Platform Administrator</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <User className="size-3.5 text-primary" /> Administrator Name
              </span>
              <p className="font-bold text-text-primary mt-0.5">{user.name}</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Phone className="size-3.5 text-emerald-500" /> Phone Number
              </span>
              <p className="font-bold text-text-primary mt-0.5">{user.phone || 'Not specified'}</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" /> Administrator Email
              </span>
              <p className="font-medium text-text-primary mt-0.5">{user.email}</p>
            </div>

            {fullLocation && (
              <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" /> Location / Address
                </span>
                <p className="font-medium text-text-primary mt-0.5">{fullLocation}</p>
              </div>
            )}
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
