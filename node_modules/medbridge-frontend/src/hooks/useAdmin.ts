import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.getDashboard(),
  });
}

export function useAdminVerifications() {
  return useQuery({
    queryKey: ['admin', 'verifications'],
    queryFn: () => adminService.getVerifications(),
  });
}

export function useAdminVerification(id: string) {
  return useQuery({
    queryKey: ['admin', 'verifications', id],
    queryFn: () => adminService.getVerification(id),
    enabled: !!id,
  });
}

export function useApproveRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.approveRecipient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
    },
  });
}

export function useRejectRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.rejectRecipient(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
    },
  });
}

export function useAdminReports() {
  return useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => adminService.getReports(),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.resolveReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.getUsers(),
  });
}

export function useAdminListings() {
  return useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: () => adminService.getListings(),
  });
}

export function useAdminAuditLogs(params?: { event?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminService.getAuditLogs(params),
  });
}

export function useImpactAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminService.getImpactAnalytics(),
  });
}
