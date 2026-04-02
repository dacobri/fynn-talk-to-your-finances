'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

export default function SettingsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
          <p className='text-muted-foreground'>Manage your Fynn preferences</p>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Icons.user className='size-5' />
                Profile
              </CardTitle>
              <CardDescription>
                Marc Ferrer — Barcelona, Spain
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Badge variant='outline'>EUR — Euro</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Icons.creditCard className='size-5' />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                1 bank account connected via CaixaBank
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Badge className='bg-green-500/10 text-green-500'>Active</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Icons.sparkles className='size-5' />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Powered by Claude — Anthropic
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Badge className='bg-green-500/10 text-green-500'>Connected</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Icons.notification className='size-5' />
                Notifications
              </CardTitle>
              <CardDescription>
                Get alerts for large transactions and spending insights
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Badge variant='outline'>Enabled</Badge>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About Fynn</CardTitle>
            <CardDescription>
              Fynn is your personal AI-powered financial command center. Connect all your bank accounts,
              get a unified view of your finances, and ask questions about your money in natural language.
              Built as part of the Prototyping Products with Data &amp; AI course at Esade MSc.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <p className='text-muted-foreground text-sm'>Version 1.0.0 — Team Fynn</p>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
