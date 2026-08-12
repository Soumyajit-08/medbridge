export type NotificationType =
  | 'NEW_MATCH'
  | 'CLAIM_REQUEST'
  | 'CLAIM_CONFIRMED'
  | 'CLAIM_CANCELLED'
  | 'EXPIRY_7_DAYS'
  | 'EXPIRY_3_DAYS'
  | 'EXPIRY_1_DAY'
  | 'LISTING_EXPIRED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'REPORT_CREATED'
  | 'REPORT_RESOLVED'
  | 'PICKUP_REMINDER';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  unreadCount: number;
}
