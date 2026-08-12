import { api } from './api';
import type { Claim, CreateClaimPayload, PaginatedClaims } from '@/types/claim';

export const claimService = {
  async getClaims(params?: { status?: string; page?: number }): Promise<PaginatedClaims> {
    const { data } = await api.get<PaginatedClaims>('/claims', { params });
    return data;
  },

  async getClaim(id: string): Promise<Claim> {
    const { data } = await api.get<Claim>(`/claims/${id}`);
    return data;
  },

  async createClaim(payload: CreateClaimPayload): Promise<Claim> {
    const { data } = await api.post<Claim>('/claims', payload);
    return data;
  },

  async confirmClaim(id: string): Promise<Claim> {
    const { data } = await api.patch<Claim>(`/claims/${id}/confirm`);
    return data;
  },

  async cancelClaim(id: string): Promise<Claim> {
    const { data } = await api.patch<Claim>(`/claims/${id}/cancel`);
    return data;
  },

  async completeClaim(id: string): Promise<Claim> {
    const { data } = await api.patch<Claim>(`/claims/${id}/complete`);
    return data;
  },
};
