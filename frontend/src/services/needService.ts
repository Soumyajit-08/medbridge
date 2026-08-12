import { api } from './api';
import type { Need, CreateNeedPayload, PaginatedNeeds } from '@/types/need';

export const needService = {
  async getNeeds(params?: { page?: number }): Promise<PaginatedNeeds> {
    const { data } = await api.get<PaginatedNeeds>('/needs', { params });
    return data;
  },

  async getNeed(id: string): Promise<Need> {
    const { data } = await api.get<Need>(`/needs/${id}`);
    return data;
  },

  async createNeed(payload: CreateNeedPayload): Promise<Need> {
    const { data } = await api.post<Need>('/needs', payload);
    return data;
  },

  async updateNeed(id: string, payload: Partial<CreateNeedPayload>): Promise<Need> {
    const { data } = await api.patch<Need>(`/needs/${id}`, payload);
    return data;
  },

  async deleteNeed(id: string): Promise<void> {
    await api.delete(`/needs/${id}`);
  },
};
