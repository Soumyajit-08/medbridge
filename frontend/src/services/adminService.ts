import { api } from './api';
import type {
  AdminDashboardStats,
  AuditLogEntry,
  ImpactMetrics,
  ReportEntry,
} from '@/types/dashboard';
import type { VerificationSubmission } from '@/types/verification';
import type { User } from '@/types/user';
import type { PaginatedListings } from '@/types/listing';

export const adminService = {
  async getDashboard(): Promise<AdminDashboardStats> {
    const { data } = await api.get<AdminDashboardStats>('/admin/dashboard');
    return data;
  },

  async getVerifications(): Promise<VerificationSubmission[]> {
    const { data } = await api.get<VerificationSubmission[]>('/admin/verifications');
    return data;
  },

  async getVerification(id: string): Promise<VerificationSubmission> {
    const { data } = await api.get<VerificationSubmission>(`/admin/verifications/${id}`);
    return data;
  },

  async approveRecipient(id: string): Promise<void> {
    await api.patch(`/admin/recipients/${id}/approve`);
  },

  async rejectRecipient(id: string, reason: string): Promise<void> {
    await api.patch(`/admin/recipients/${id}/reject`, { reason });
  },

  async getReports(): Promise<ReportEntry[]> {
    const { data } = await api.get<ReportEntry[]>('/admin/reports');
    return data;
  },

  async resolveReport(id: string): Promise<void> {
    await api.patch(`/admin/reports/${id}/resolve`);
  },

  async getAuditLogs(params?: { event?: string; page?: number }): Promise<{
    data: AuditLogEntry[];
    total: number;
  }> {
    const { data } = await api.get('/admin/audit-logs', { params });
    return data;
  },

  async getUsers(): Promise<User[]> {
    const { data } = await api.get<User[]>('/admin/users');
    return data;
  },

  async getListings(): Promise<PaginatedListings> {
    const { data } = await api.get<PaginatedListings>('/admin/listings');
    return data;
  },

  async getImpactAnalytics(): Promise<ImpactMetrics> {
    const { data } = await api.get<ImpactMetrics>('/admin/analytics');
    return data;
  },
};
