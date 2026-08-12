import { api } from './api';
import type { PaginatedNotifications, Notification } from '@/types/notification';

export const notificationService = {
  async getNotifications(): Promise<PaginatedNotifications> {
    const { data } = await api.get<PaginatedNotifications>('/notifications');
    return data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const { data } = await api.patch<Notification>(`/notifications/${id}/read`);
    return data;
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};
