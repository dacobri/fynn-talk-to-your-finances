'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { fetchSubscriptions, type SubscriptionsResponse } from '@/features/finance/utils/api';

function fmt(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '0,00';
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const categoryColors: Record<string, string> = {
  Entertainment: 'bg-amber-500/10 text-amber-500',
  'Entertainment & Recreation': 'bg-amber-500/10 text-amber-500',
  Utilities: 'bg-blue-500/10 text-blue-500',
  'Utilities & Services': 'bg-blue-500/10 text-blue-500',
  'Food & Dining': 'bg-orange-500/10 text-orange-500',
  Healthcare: 'bg-emerald-500/10 text-emerald-500',
  'Healthcare & Medical': 'bg-emerald-500/10 text-emerald-500',
  Transportation: 'bg-pink-500/10 text-pink-500',
  'Shopping & Retail': 'bg-purple-500/10 text-purple-500',
  'Financial Services': 'bg-cyan-500/10 text-cyan-500',
};

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-4xl flex-col space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Subscriptions</h2>
          <p className='text-muted-foreground'>
            Recurring charges detected from your transaction history
          </p>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Active Subscriptions</CardDescription>
              <CardTitle className='text-2xl'>
                {loading ? <Skeleton className='h-8 w-12' /> : (data?.activeCount ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Monthly Total</CardDescription>
              <CardTitle className='text-2xl text-red-500'>
                {loading ? <Skeleton className='h-8 w-24' /> : `€${fmt(data?.totalMonthly)}`}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Annual Estimate</CardDescription>
              <CardTitle className='text-2xl'>
                {loading ? <Skeleton className='h-8 w-28' /> : `€${fmt((data?.totalMonthly ?? 0) * 12)}`}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.circleCheck className='h-5 w-5 text-green-500' />
              Active Subscriptions
            </CardTitle>
            <CardDescription>
              Recurring charges detected in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='space-y-3'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className='h-14 w-full' />
                ))}
              </div>
            ) : (
              <div className='space-y-2'>
                {(data?.active ?? []).map((sub, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between rounded-lg border p-4'
                  >
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm font-medium'>{sub.merchant}</span>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className={categoryColors[sub.category] || 'bg-slate-500/10 text-slate-500'}
                        >
                          {sub.category}
                        </Badge>
                        <span className='text-xs text-muted-foreground'>
                          {sub.chargeCount} charges · Last: {formatDate(sub.lastCharge)}
                        </span>
                      </div>
                    </div>
                    <span className='text-sm font-semibold tabular-nums'>
                      €{fmt(sub.monthlyCost)}/mo
                    </span>
                  </div>
                ))}
                {(data?.active ?? []).length === 0 && (
                  <p className='text-sm text-muted-foreground py-4'>
                    No active subscriptions detected.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Subscriptions */}
        {(data?.inactive ?? []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-muted-foreground'>
                <Icons.close className='h-5 w-5' />
                Inactive Subscriptions
              </CardTitle>
              <CardDescription>
                Recurring charges not seen in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {data!.inactive.map((sub, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between rounded-lg border border-dashed p-4 opacity-60'
                  >
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm font-medium'>{sub.merchant}</span>
                      <span className='text-xs text-muted-foreground'>
                        Last charge: {formatDate(sub.lastCharge)}
                      </span>
                    </div>
                    <span className='text-sm font-medium tabular-nums text-muted-foreground'>
                      €{fmt(sub.monthlyCost)}/mo
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
