import type { Need } from '@/types/need';
import { initialMedicines } from './medicines';

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

const paracetamol = initialMedicines.find((m) => m.id === 'med-paracetamol-500')!;
const metformin = initialMedicines.find((m) => m.id === 'med-metformin-500')!;

export const initialNeeds: Need[] = [
  {
    id: 'need-paracetamol-hope',
    recipientId: 'user-recipient-hope',
    medicine: paracetamol,
    quantityNeeded: 50,
    urgency: 'HIGH',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    description: 'Urgent need for outpatient fever management at Hope Care Clinic.',
    status: 'ACTIVE',
    matchCount: 1,
    expiresAt: addDays(14),
    createdAt: '2026-08-09T07:00:00.000Z',
  },
  {
    id: 'need-metformin-hope',
    recipientId: 'user-recipient-hope',
    medicine: metformin,
    quantityNeeded: 100,
    urgency: 'MEDIUM',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    description: 'Monthly stock replenishment for diabetes patients.',
    status: 'ACTIVE',
    matchCount: 0,
    expiresAt: addDays(30),
    createdAt: '2026-08-05T12:00:00.000Z',
  },
  {
    id: 'need-paracetamol-pending',
    recipientId: 'user-recipient-pending',
    medicine: paracetamol,
    quantityNeeded: 25,
    urgency: 'LOW',
    location: {
      city: 'Pune',
      state: 'Maharashtra',
    },
    description: 'Basic analgesic stock for community health camp.',
    status: 'ACTIVE',
    matchCount: 1,
    expiresAt: addDays(21),
    createdAt: '2026-08-11T08:00:00.000Z',
  },
];
