import type { Claim } from '@/types/claim';
import { initialMedicines } from './medicines';

const paracetamol = initialMedicines.find((m) => m.id === 'med-paracetamol-500')!;
const ibuprofen = initialMedicines.find((m) => m.id === 'med-ibuprofen-400')!;

export const initialClaims: Claim[] = [
  {
    id: 'claim-pending-hope',
    listingId: 'listing-paracetamol-abc',
    recipientId: 'user-recipient-hope',
    recipientOrganization: 'Hope Care Clinic',
    recipientVerificationStatus: 'APPROVED',
    medicine: paracetamol,
    requestedQuantity: 30,
    availableQuantity: 100,
    donorType: 'PHARMACY',
    status: 'PENDING',
    createdAt: '2026-08-11T10:00:00.000Z',
  },
  {
    id: 'claim-confirmed-hope',
    listingId: 'listing-paracetamol-abc',
    recipientId: 'user-recipient-hope',
    recipientOrganization: 'Hope Care Clinic',
    recipientVerificationStatus: 'APPROVED',
    medicine: paracetamol,
    requestedQuantity: 20,
    availableQuantity: 70,
    donorType: 'PHARMACY',
    status: 'CONFIRMED',
    createdAt: '2026-08-10T15:30:00.000Z',
    confirmedAt: '2026-08-10T16:00:00.000Z',
  },
  {
    id: 'claim-completed-ibuprofen',
    listingId: 'listing-ibuprofen-abc',
    recipientId: 'user-recipient-hope',
    recipientOrganization: 'Hope Care Clinic',
    recipientVerificationStatus: 'APPROVED',
    medicine: ibuprofen,
    requestedQuantity: 40,
    availableQuantity: 40,
    donorType: 'PHARMACY',
    status: 'COMPLETED',
    createdAt: '2026-08-01T11:00:00.000Z',
    confirmedAt: '2026-08-01T12:00:00.000Z',
    completedAt: '2026-08-05T16:30:00.000Z',
  },
  {
    id: 'claim-cancelled-paracetamol',
    listingId: 'listing-paracetamol-abc',
    recipientId: 'user-recipient-pending',
    recipientOrganization: 'Sunrise Community Clinic',
    recipientVerificationStatus: 'PENDING',
    medicine: paracetamol,
    requestedQuantity: 10,
    availableQuantity: 100,
    donorType: 'PHARMACY',
    status: 'CANCELLED',
    createdAt: '2026-08-09T09:00:00.000Z',
    cancelledAt: '2026-08-09T14:00:00.000Z',
  },
];
