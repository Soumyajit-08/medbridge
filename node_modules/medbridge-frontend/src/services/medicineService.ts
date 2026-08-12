import { api } from './api';
import type { Medicine, MedicineSearchResult } from '@/types/medicine';

export const medicineService = {
  async search(query: string): Promise<MedicineSearchResult[]> {
    const { data } = await api.get<MedicineSearchResult[]>('/medicines', {
      params: { q: query },
    });
    return data;
  },

  async getMedicine(id: string): Promise<Medicine> {
    const { data } = await api.get<Medicine>(`/medicines/${id}`);
    return data;
  },
};
