import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Finance',
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
