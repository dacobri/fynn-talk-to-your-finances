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
        title: 'Investments',
        url: '/dashboard/investments',
        icon: 'trendingUp',
        shortcut: ['i', 'i'],
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

/**
 * Extra pages surfaced in the ⌘K command palette only (not in sidebar).
 * Grouped into KBar sections: "Pages" merges with sidebar items,
 * "Account" is a separate section.
 */
export const kbarExtraItems: NavGroup[] = [
  {
    label: 'Pages',
    items: [
      {
        title: 'Subscriptions',
        url: '/dashboard/subscriptions',
        icon: 'creditCard',
        shortcut: ['s', 's'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Account',
    items: [
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
        title: 'Notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        isActive: false,
        items: []
      }
    ]
  }
];
