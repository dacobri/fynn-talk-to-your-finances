import { cn } from '@/lib/utils';
import { SignUp as ClerkSignUpForm } from '@clerk/nextjs';
import { Metadata } from 'next';
import { InteractiveGridPattern } from './interactive-grid';

export const metadata: Metadata = {
  title: 'Sign Up — Fynn',
  description: 'Create your Fynn account'
};

export default function SignUpViewPage() {
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <div className='bg-primary text-primary-foreground mr-2 flex h-8 w-8 items-center justify-center rounded-lg font-bold'>
            F
          </div>
          Fynn
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;Talk to your finances. Connect all your accounts, get AI-powered insights, and
              take control of your money.&rdquo;
            </p>
            <footer className='text-sm'>Fynn — Your Financial Command Center</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <div className='flex flex-col items-center space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>Create your account</h1>
            <p className='text-muted-foreground text-sm'>Get started with Fynn in seconds</p>
          </div>
          <ClerkSignUpForm />
        </div>
      </div>
    </div>
  );
}
