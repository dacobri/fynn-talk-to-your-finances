import { NavGroup } from '@/types';

/** Sidebar-only navigation — keep this minimal. */
export const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Transactions',
        url: '/dashboard/transactions',
        icon: 'creditCard',
        shortcut: ['t', 't'],
        isActive: false,
        items: []
      },
      {
        title: 'Chat with Fynn',
        url: '/dashboard/chat',
        icon: 'chat',
        shortcut: ['c', 'c'],
        isActive: false,
        items: []
      }
    ]
  }
];

/** Extra pages available via ⌘K command palette (and profile menu) only. */
export const kbarExtraItems: NavGroup[] = [
  {
    label: 'Account',
    items: [
      {
        title: 'Subscriptions',
        url: '/dashboard/subscriptions',
        icon: 'creditCard',
        shortcut: ['s', 's'],
        isActive: false,
        items: []
      },
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'user',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Billing',
        url: '/dashboard/billing',
        icon: 'creditCard',
        isActive: false,
        items: []
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        isActive: false,
        items: []
      },
      {
        title: 'Notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        isActive: false,
        items: []
      }
    ]
  }
];
