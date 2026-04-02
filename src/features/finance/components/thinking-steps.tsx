'use client';

import { cn } from '@/lib/utils';

interface ThinkingStepsProps {
  steps: string[];
}

export function ThinkingSteps({ steps }: ThinkingStepsProps) {
  const currentStep = steps[steps.length - 1] ?? 'Thinking...';
  const previousSteps = steps.slice(0, -1);

  return (
    <div className='flex gap-3 justify-start'>
      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground'>
        F
      </div>
      <div className='flex flex-col gap-1 max-w-[88%]'>
        <div className='rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm'>
          {/* Completed steps */}
          {previousSteps.map((step, i) => (
            <div key={i} className='flex items-center gap-2 text-xs text-muted-foreground opacity-50 mb-1'>
              <span className='text-green-500'>✓</span>
              <span>{step}</span>
            </div>
          ))}
          {/* Current step */}
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span className='inline-block h-3 w-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin' />
            <span>{currentStep}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
