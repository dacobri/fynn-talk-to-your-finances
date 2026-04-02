import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Sign Up — Fynn',
  description: 'Create your Fynn account'
};

export default async function Page() {
  return <SignUpViewPage />;
}
