import { api } from './api';
import type { DashboardStats } from '@/types/dashboard';

export const dashboardService = {
  async getDonorDashboard(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/donor/dashboard');
    return data;
  },

  async getRecipientDashboard(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/recipient/dashboard');
    return data;
  },
};
