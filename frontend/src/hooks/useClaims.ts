import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimService } from '@/services/claimService';
import { useUIStore } from '@/store/uiStore';
import type { CreateClaimPayload } from '@/types/claim';

export function useClaims(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['claims', params],
    queryFn: () => claimService.getClaims(params),
  });
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: ['claims', id],
    queryFn: () => claimService.getClaim(id),
    enabled: !!id,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (payload: CreateClaimPayload) => claimService.createClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      addToast('success', 'Claim request submitted. The donor will review your request.', 'Claim Submitted');
    },
  });
}

export function useConfirmClaim() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => claimService.confirmClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      addToast('success', 'Claim request approved.', 'Claim Approved');
    },
  });
}

export function useRejectClaim() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => claimService.cancelClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      addToast('info', 'Claim request cancelled.', 'Claim Cancelled');
    },
  });
}

export function useCompleteClaim() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => claimService.completeClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      addToast('success', 'Medicine claim completed successfully.', 'Claim Completed');
    },
  });
}
