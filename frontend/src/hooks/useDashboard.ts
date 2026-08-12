import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

export function useDonorDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'donor'],
    queryFn: () => dashboardService.getDonorDashboard(),
  });
}

export function useRecipientDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'recipient'],
    queryFn: () => dashboardService.getRecipientDashboard(),
  });
}
