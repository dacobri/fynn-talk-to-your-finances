import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Sign In — Fynn',
  description: 'Sign in to your Fynn account'
};

export default async function Page() {
  return <SignInViewPage />;
}
