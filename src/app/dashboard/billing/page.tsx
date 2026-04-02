'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { fetchStats } from '@/features/finance/utils/api';

export default function BillingPage() {
  const [transactionCount, setTransactionCount] = useState<number | null>(null);

  useEffect(() => {
    fetchStats().then((stats) => setTransactionCount(stats.transactionCount));
  }, []);

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-3xl flex-col space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Billing</h2>
          <p className='text-muted-foreground'>Manage your Fynn subscription and payment method</p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  Fynn Pro
                  <Badge className='bg-primary/10 text-primary'>Active</Badge>
                </CardTitle>
                <CardDescription className='mt-1'>
                  Full access to AI financial assistant, unlimited transactions, and advanced analytics
                </CardDescription>
              </div>
              <div className='text-right'>
                <p className='text-2xl font-bold'>€9.99</p>
                <p className='text-xs text-muted-foreground'>per month</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-3 text-sm'>
              <div className='flex items-center gap-2'>
                <Icons.circleCheck className='h-4 w-4 text-green-500' />
                <span>Unlimited AI chat queries</span>
              </div>
              <div className='flex items-center gap-2'>
                <Icons.circleCheck className='h-4 w-4 text-green-500' />
                <span>Real-time transaction categorization</span>
              </div>
              <div className='flex items-center gap-2'>
                <Icons.circleCheck className='h-4 w-4 text-green-500' />
                <span>Advanced spending analytics and charts</span>
              </div>
              <div className='flex items-center gap-2'>
                <Icons.circleCheck className='h-4 w-4 text-green-500' />
                <span>Up to 5 connected bank accounts</span>
              </div>
              <div className='flex items-center gap-2'>
                <Icons.circleCheck className='h-4 w-4 text-green-500' />
                <span>Export financial reports (PDF)</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className='border-t pt-4'>
            <p className='text-xs text-muted-foreground'>
              Next billing date: January 15, 2025 · Renews automatically
            </p>
          </CardFooter>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.creditCard className='size-5' />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between rounded-lg border p-4'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-14 items-center justify-center rounded bg-muted text-xs font-bold'>
                  VISA
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>Visa ending in 4242</span>
                  <span className='text-xs text-muted-foreground'>Expires 08/2027</span>
                </div>
              </div>
              <Badge variant='outline'>Default</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>December 2024</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>AI chat queries</span>
              <span className='text-sm font-medium'>47 / Unlimited</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Transactions analyzed</span>
              <span className='text-sm font-medium'>
                {transactionCount !== null ? transactionCount.toLocaleString() : '...'}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Charts generated</span>
              <span className='text-sm font-medium'>23</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Connected accounts</span>
              <span className='text-sm font-medium'>1 / 5</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
