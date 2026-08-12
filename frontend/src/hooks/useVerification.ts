import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationService } from '@/services/verificationService';
import type { VerificationPayload } from '@/types/verification';

export function useVerification() {
  return useQuery({
    queryKey: ['verification'],
    queryFn: () => verificationService.getVerification(),
  });
}

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerificationPayload) =>
      verificationService.submitVerification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification'] });
    },
  });
}
