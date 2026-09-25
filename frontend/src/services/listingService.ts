import { api } from './api';
import type {
  Listing,
  ListingFilters,
  CreateListingPayload,
  PaginatedListings,
} from '@/types/listing';

export const listingService = {
  async getListings(filters?: ListingFilters): Promise<PaginatedListings> {
    const { data } = await api.get<PaginatedListings>('/listings', { params: filters });
    return data;
  },

  async getListing(id: string): Promise<Listing> {
    const { data } = await api.get<Listing>(`/listings/${id}`);
    return data;
  },

  async createListing(payload: CreateListingPayload, image?: File): Promise<Listing> {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'safetyChecklist') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    if (image) formData.append('image', image);
    const { data } = await api.post<Listing>('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async updateListing(id: string, payload: Partial<CreateListingPayload>): Promise<Listing> {
    const { data } = await api.patch<Listing>(`/listings/${id}`, payload);
    return data;
  },

  async uploadImage(id: string, image: File): Promise<Listing> {
    const formData = new FormData();
    formData.append('image', image);
    const { data } = await api.post<Listing>(`/listings/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteListing(id: string): Promise<void> {
    await api.delete(`/listings/${id}`);
  },

  async reportListing(id: string, reason: string): Promise<void> {
    await api.post(`/listings/${id}/report`, { reason });
  },

  async getMyListings(filters?: ListingFilters): Promise<PaginatedListings> {
    const { data } = await api.get<PaginatedListings>('/listings', {
      params: { ...filters, mine: true },
    });
    return data;
  },
};
