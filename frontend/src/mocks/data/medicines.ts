import type { Medicine, MedicineSearchResult } from '@/types/medicine';

export const initialMedicines: Medicine[] = [
  {
    id: 'med-paracetamol-500',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    category: 'Analgesic',
    manufacturer: 'Cipla Ltd.',
    dosageForm: 'Tablet',
    strength: '500mg',
  },
  {
    id: 'med-amoxicillin-250',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    manufacturer: 'Sun Pharma',
    dosageForm: 'Capsule',
    strength: '250mg',
  },
  {
    id: 'med-ibuprofen-400',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'NSAID',
    manufacturer: 'Dr. Reddy\'s',
    dosageForm: 'Tablet',
    strength: '400mg',
  },
  {
    id: 'med-metformin-500',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    manufacturer: 'USV Ltd.',
    dosageForm: 'Tablet',
    strength: '500mg',
  },
  {
    id: 'med-omeprazole-20',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    category: 'Antacid',
    manufacturer: 'Torrent Pharma',
    dosageForm: 'Capsule',
    strength: '20mg',
  },
];

export function toSearchResult(medicine: Medicine): MedicineSearchResult {
  return {
    ...medicine,
    label: `${medicine.name} ${medicine.strength} (${medicine.dosageForm})`,
  };
}
