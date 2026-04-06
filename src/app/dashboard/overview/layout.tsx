'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import React from 'react';
import Link from 'next/link';
import { DashboardProvider, useDashboard } from '@/features/finance/components/dashboard-context';
import { DateRangeSelector } from '@/features/finance/components/date-range-selector';
import { Skeleton } from '@/components/ui/skeleton';

function MetricCard({
  label,
  value,
  badge,
  valueClassName = '',
  loading = false,
  href,
}: {
  label: string;
  value: string;
  badge: React.ReactNode;
  valueClassName?: string;
  loading?: boolean;
  href?: string;
}) {
  const card = (
    <Card className={`@container/card ${href ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}>
      <CardHeader className='py-2.5'>
        <CardDescription>{label}</CardDescription>
        {loading ? (
          <Skeleton className='h-5 w-24' />
        ) : (
          <CardTitle className={`text-base font-semibold tabular-nums leading-tight truncate ${valueClassName}`}>
            {value}
          </CardTitle>
        )}
        <CardAction>{loading ? <Skeleton className='h-5 w-16' /> : badge}</CardAction>
      </CardHeader>
    </Card>
  );
  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

function fmt(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DashboardContent({
  sales,
  pie_stats,
  bar_stats,
  area_stats,
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const { dateRange, setDateRange, data } = useDashboard();
  const { summary, investmentTotals, investmentHistory, loading } = data;

  const totalIncome = summary?.totalIncome ?? 0;
  const totalSpent = summary?.totalSpent ?? 0;
  const netBalance = summary?.netBalance ?? 0;
  const topCat = summary?.topCategory ?? { name: '—', amount: 0 };
  const subs = summary?.subscriptions ?? { count: 0, monthlyTotal: 0 };

  const histLen = investmentHistory.length;
  const periodEndValue = histLen > 0 ? investmentHistory[histLen - 1].amount : (investmentTotals?.currentValue ?? 0);
  const periodStartValue = histLen > 1 ? investmentHistory[0].amount : 0;
  const periodReturn = periodStartValue > 0
    ? ((periodEndValue - periodStartValue) / periodStartValue) * 100
    : (investmentTotals?.returnPct ?? 0);

  const metricCards = [
    {
      id: 'income',
      label: 'Total Income',
      value: `€${fmt(totalIncome)}`,
      valueClassName: 'text-green-500',
      badge: (
        <Badge variant='outline' className='bg-green-500/10 text-green-500'>
          <Icons.trendingUp className='h-3 w-3' />
          Income
        </Badge>
      ),
    },
    {
      id: 'spent',
      label: 'Total Spent',
      value: `€${fmt(totalSpent)}`,
      valueClassName: 'text-red-500',
      badge: (
        <Badge variant='outline' className='bg-red-500/10 text-red-500'>
          <Icons.trendingDown className='h-3 w-3' />
          Expenses
        </Badge>
      ),
    },
    {
      id: 'balance',
      label: 'Net Balance',
      value: `${netBalance >= 0 ? '' : '-'}€${fmt(Math.abs(netBalance))}`,
      valueClassName: netBalance >= 0 ? 'text-green-500' : 'text-red-500',
      badge: (
        <Badge variant='outline' className={netBalance >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
          {netBalance >= 0 ? 'Surplus' : 'Deficit'}
        </Badge>
      ),
    },
    {
      id: 'topcat',
      label: 'Top Category',
      value: topCat.name,
      badge: <Badge variant='outline'>€{fmt(topCat.amount)}</Badge>,
    },
    {
      id: 'subs',
      label: 'Subscriptions',
      value: `${subs.count} active`,
      href: '/dashboard/subscriptions',
      badge: <Badge variant='outline'>€{fmt(subs.monthlyTotal)}/mo</Badge>,
    },
    {
      id: 'investments',
      label: 'Investment Assets',
      value: `€${fmt(periodEndValue)}`,
      href: '/dashboard/investments',
      badge: (
        <Badge variant='outline' className={periodReturn >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
          {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(1)}%
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-1.5'>
        {/* Date Range Selector */}
        <DateRangeSelector value={dateRange} onChange={setDateRange} />

        {/* Metric Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card grid grid-cols-2 gap-1.5 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-3 lg:grid-cols-6'>
          {metricCards.map((card) => (
            <MetricCard
              key={card.id}
              label={card.label}
              value={card.value}
              valueClassName={card.valueClassName}
              loading={loading}
              href={card.href}
              badge={card.badge}
            />
          ))}
        </div>

        {/* Charts Grid */}
        <div className='grid grid-cols-1 gap-2 lg:grid-cols-7'>
          <div className='col-span-1 lg:col-span-4 flex flex-col gap-2'>
            {area_stats}
            {bar_stats}
          </div>
          <div className='col-span-1 lg:col-span-3 flex flex-col gap-2'>
            {pie_stats}
            {sales}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardContent sales={sales} pie_stats={pie_stats} bar_stats={bar_stats} area_stats={area_stats} />
    </DashboardProvider>
  );
}