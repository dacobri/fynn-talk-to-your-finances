import { create } from 'zustand';
import type { NotificationStatus, NotificationAction } from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Spending alert',
    body: 'Your Food & Dining spending is up 23% this month — €1,450 vs your €1,180 average. Consider reviewing your dining expenses.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actions: [
      {
        id: 'view-transactions',
        label: 'View transactions',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '2',
    title: 'Unusual transaction detected',
    body: 'A transaction of €2,400.00 at CaixaBank ATM was recorded on Dec 15. This is higher than your typical withdrawal.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    actions: [
      {
        id: 'review',
        label: 'Review transaction',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '3',
    title: 'Subscription renewed',
    body: 'Your Netflix subscription has been renewed: €17.99 charged to your CaixaBank account on Dec 20.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    actions: [
      {
        id: 'view-subs',
        label: 'View subscriptions',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '4',
    title: 'Monthly summary ready',
    body: 'Your December 2024 financial summary is ready. Total spent: €5,211.39 across 287 transactions.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actions: [
      {
        id: 'view-summary',
        label: 'View dashboard',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '5',
    title: 'Budget milestone reached',
    body: 'You\'ve spent 85% of your monthly budget (€4,250 / €5,000). You have €750 remaining for the rest of December.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    actions: [
      {
        id: 'view-overview',
        label: 'View overview',
        type: 'redirect',
        style: 'primary'
      }
    ]
  }
];

export const useNotificationStore = create<NotificationState>()(
  (set, get) => ({
    notifications: mockNotifications,

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      })),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          status: 'read' as const
        }))
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [{ ...notification, status: 'unread' as const }, ...state.notifications]
      })),

    unreadCount: () => get().notifications.filter((n) => n.status === 'unread').length
  })
);
