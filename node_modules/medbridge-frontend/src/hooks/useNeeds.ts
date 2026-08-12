import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { needService } from '@/services/needService';
import type { CreateNeedPayload } from '@/types/need';

export function useNeeds(params?: { page?: number }) {
  return useQuery({
    queryKey: ['needs', params],
    queryFn: () => needService.getNeeds(params),
  });
}

export function useNeed(id: string) {
  return useQuery({
    queryKey: ['needs', id],
    queryFn: () => needService.getNeed(id),
    enabled: !!id,
  });
}

export function useCreateNeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNeedPayload) => needService.createNeed(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['needs'] }),
  });
}

export function useDeleteNeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => needService.deleteNeed(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['needs'] }),
  });
}
