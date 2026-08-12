import type { Listing } from '@/types/listing';
import { initialMedicines } from './medicines';

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function daysFromNow(days: number): number {
  return days;
}

const paracetamol = initialMedicines.find((m) => m.id === 'med-paracetamol-500')!;
const amoxicillin = initialMedicines.find((m) => m.id === 'med-amoxicillin-250')!;
const ibuprofen = initialMedicines.find((m) => m.id === 'med-ibuprofen-400')!;

const demoExpiryDays = 15;
const demoExpiryDate = addDays(demoExpiryDays);

export const initialListings: Listing[] = [
  {
    id: 'listing-paracetamol-abc',
    donorId: 'user-donor-abc',
    donorName: 'ABC Pharmacy',
    donorType: 'PHARMACY',
    medicine: paracetamol,
    batchNumber: 'BATCH-PCM-2026-042',
    expiryDate: demoExpiryDate,
    daysRemaining: daysFromNow(demoExpiryDays),
    quantity: 100,
    quantityAvailable: 70,
    urgency: 'HIGH',
    packagingCondition: 'SEALED_INTACT',
    storageConfirmed: true,
    imageUrl: undefined,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      approximateDistanceKm: 2.5,
    },
    status: 'CLAIM_PENDING',
    eligibilityScreeningPassed: true,
    createdAt: '2026-08-10T08:30:00.000Z',
    updatedAt: '2026-08-11T14:00:00.000Z',
  },
  {
    id: 'listing-amoxicillin-abc',
    donorId: 'user-donor-abc',
    donorName: 'ABC Pharmacy',
    donorType: 'PHARMACY',
    medicine: amoxicillin,
    batchNumber: 'BATCH-AMX-2026-018',
    expiryDate: addDays(45),
    daysRemaining: 45,
    quantity: 60,
    quantityAvailable: 60,
    urgency: 'MEDIUM',
    packagingCondition: 'SEALED_INTACT',
    storageConfirmed: true,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      approximateDistanceKm: 2.5,
    },
    status: 'ACTIVE',
    eligibilityScreeningPassed: true,
    createdAt: '2026-08-08T10:00:00.000Z',
    updatedAt: '2026-08-08T10:00:00.000Z',
  },
  {
    id: 'listing-ibuprofen-abc',
    donorId: 'user-donor-abc',
    donorName: 'ABC Pharmacy',
    donorType: 'PHARMACY',
    medicine: ibuprofen,
    batchNumber: 'BATCH-IBU-2026-007',
    expiryDate: addDays(8),
    daysRemaining: 8,
    quantity: 40,
    quantityAvailable: 0,
    urgency: 'CRITICAL',
    packagingCondition: 'SEALED_INTACT',
    storageConfirmed: true,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      approximateDistanceKm: 2.5,
    },
    status: 'COMPLETED',
    eligibilityScreeningPassed: true,
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-08-05T16:30:00.000Z',
  },
];
