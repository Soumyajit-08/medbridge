import { useState } from 'react';
import {
  Building2,
  Check,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser, DonorType, OrganizationType } from '@/types/auth';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const { updateProfile, isUpdatingProfile } = useAuth();

  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [donorType, setDonorType] = useState<DonorType>(user.donorType || 'HOUSEHOLD');
  const [organizationName, setOrganizationName] = useState(user.organizationName || '');
  const [organizationType, setOrganizationType] = useState<OrganizationType>(user.organizationType || 'NGO');
  const [address, setAddress] = useState(user.address || '');
  const [city, setCity] = useState(user.city || '');
  const [state, setState] = useState(user.state || '');
  const [pincode, setPincode] = useState(user.pincode || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        donorType: user.role === 'DONOR' ? donorType : undefined,
        organizationName: user.role === 'RECIPIENT' ? organizationName.trim() : undefined,
        organizationType: user.role === 'RECIPIENT' ? organizationType : undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
      });
      onClose();
    } catch {
      // toast is handled in useAuth
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <User className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-base">Edit Profile Information</h3>
              <p className="text-xs text-text-muted">Update your account details and contact information</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Read-Only Account Info Banner */}
            <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-1.5 font-medium">
                  <Mail className="size-3.5 text-primary" /> Registered Email:
                </span>
                <span className="font-semibold text-text-primary">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-1.5 font-medium">
                  <Shield className="size-3.5 text-emerald-500" /> Account Role:
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Full Name / Representative Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Mobile / Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-3.5 py-2.5 text-sm font-medium text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="mt-1 text-[11px] text-text-muted">
                This number is used for donation coordinates and handover calls.
              </p>
            </div>

            {/* Donor-Specific Fields */}
            {user.role === 'DONOR' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Donor Type
                </label>
                <select
                  value={donorType}
                  onChange={(e) => setDonorType(e.target.value as DonorType)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="HOUSEHOLD">Household / Individual Donor</option>
                  <option value="PHARMACY">Retail Pharmacy / Chemist</option>
                  <option value="AUTHORIZED_ORGANIZATION">Healthcare Organization / Clinic</option>
                </select>
              </div>
            )}

            {/* Recipient-Specific Fields */}
            {user.role === 'RECIPIENT' && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    Organization / Hospital / Clinic Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-primary" />
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. City General Hospital or Aasha Foundation"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-3.5 py-2.5 text-sm text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    Organization Type
                  </label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="NGO">Non-Governmental Organization (NGO)</option>
                    <option value="CLINIC">Charitable Clinic</option>
                    <option value="HOSPITAL">Hospital / Medical Center</option>
                    <option value="AUTHORIZED_HEALTHCARE_ORGANIZATION">Authorized Healthcare Facility</option>
                  </select>
                </div>
              </div>
            )}

            {/* Address Details (Optional) */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Location & Address (Optional)
                </span>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Area / Building"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs text-text-muted mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="700001"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary outline-hidden transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-border px-6 py-4 bg-background/50">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-background cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              size="sm"
              isLoading={isUpdatingProfile}
              className="flex items-center gap-1.5"
            >
              <Check className="size-4" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
