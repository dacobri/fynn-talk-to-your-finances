'use client';

import { cn } from '@/lib/utils';

export function TypingIndicator() {
  return (
    <div className='flex items-end gap-2'>
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
        <span className='text-xs font-bold text-muted-foreground'>F</span>
      </div>
      <div className='flex gap-1 rounded-lg bg-muted px-3 py-2'>
        <div
          className='h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce'
          style={{
            animationDelay: '0ms'
          }}
        />
        <div
          className='h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce'
          style={{
            animationDelay: '150ms'
          }}
        />
        <div
          className='h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce'
          style={{
            animationDelay: '300ms'
          }}
        />
      </div>
    </div>
  );
}
