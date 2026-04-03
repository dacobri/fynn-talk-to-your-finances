'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useDashboard } from '@/features/finance/components/dashboard-context';

const GRANULARITY_TITLES: Record<string, string> = {
  daily: 'Daily Portfolio Value',
  weekly: 'Weekly Portfolio Value',
  monthly: 'Monthly Portfolio Value',
};

const chartConfig = {
  portfolio: {
    label: 'Portfolio',
    color: 'hsl(142, 71%, 45%)',
  },
} satisfies ChartConfig;

export default function PieStatsPage() {
  const { data } = useDashboard();
  const { investmentHistory, investmentGranularity, loading } = data;

  const chartData = investmentHistory.map((item) => ({
    label: item.label,
    portfolio: item.amount,
  }));

  const average = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.portfolio, 0) / chartData.length
    : 0;

  const title = GRANULARITY_TITLES[investmentGranularity] || 'Portfolio Value';

  return (
    <Card className='@container/card'>
      <CardHeader className='py-2'>
        <CardTitle>
          <Link href='/dashboard/investments' className='hover:underline'>
            {title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className='pb-3'>
        {loading ? (
          <Skeleton className='h-[155px] w-full' />
        ) : chartData.length === 0 ? (
          <div className='flex h-[155px] items-center justify-center text-sm text-muted-foreground'>
            No portfolio data for this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className='w-full' style={{ height: '155px' }}>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData} margin={{ top: 8, right: 70, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id='colorPortfolio' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='hsl(142, 71%, 45%)' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='hsl(142, 71%, 45%)' stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: chartData.length > 15 ? 9 : 12 }}
                  interval={chartData.length > 20 ? Math.floor(chartData.length / 10) : 'preserveStartEnd'}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => `€${(value as number).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                {average > 0 && (
                  <ReferenceLine
                    y={average}
                    stroke='hsl(var(--muted-foreground))'
                    strokeDasharray='5 5'
                    label={{ value: `Avg: €${average.toFixed(0)}`, position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                )}
                <Area
                  type='monotone'
                  dataKey='portfolio'
                  stroke='hsl(142, 71%, 45%)'
                  fillOpacity={1}
                  fill='url(#colorPortfolio)'
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
