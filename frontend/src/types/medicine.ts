export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
}

export interface MedicineSearchResult extends Medicine {
  label: string;
}
