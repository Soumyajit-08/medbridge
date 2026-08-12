import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimService } from '@/services/claimService';
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
  return useMutation({
    mutationFn: (payload: CreateClaimPayload) => claimService.createClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useConfirmClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => claimService.confirmClaim(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claims'] }),
  });
}

export function useRejectClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => claimService.cancelClaim(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claims'] }),
  });
}

export function useCompleteClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => claimService.completeClaim(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claims'] }),
  });
}
