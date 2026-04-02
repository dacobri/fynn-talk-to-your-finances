'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useChatStore } from '../utils/chat-store';
import { cn } from '@/lib/utils';

export function ChatFAB() {
  const pathname = usePathname();
  const { togglePanel, messages } = useChatStore();

  // Don't show FAB on the chat page
  if (pathname === '/dashboard/chat') {
    return null;
  }

  // Check if there are unread messages (messages after the welcome message)
  const hasUnreadMessages = messages.length > 1;

  return (
    <Button
      onClick={togglePanel}
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95',
        'bg-primary text-primary-foreground hover:bg-primary/90'
      )}
      size='icon'
      aria-label='Open chat'
    >
      <Icons.chat className='h-6 w-6' />
      {hasUnreadMessages && (
        <span className='absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-destructive' />
      )}
    </Button>
  );
}
