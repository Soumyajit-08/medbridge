import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '@/services/listingService';
import type { ListingFilters, CreateListingPayload } from '@/types/listing';

export function useListings(filters?: ListingFilters) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingService.getListings(filters),
  });
}

export function useMyListings(filters?: ListingFilters) {
  return useQuery({
    queryKey: ['listings', 'mine', filters],
    queryFn: () => listingService.getMyListings(filters),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: () => listingService.getListing(id),
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, image }: { payload: CreateListingPayload; image?: File }) =>
      listingService.createListing(payload, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingService.deleteListing(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });
}
