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
  const { data, dateRange } = useDashboard();
  const { investmentHistory, investmentGranularity, loading } = data;

  const chartData = investmentHistory.map((item) => ({
    label: item.label,
    portfolio: item.amount,
  }));

  const average = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.portfolio, 0) / chartData.length
    : 0;


  // Calculate how many days the selected range spans
  const spanDays = chartData.length > 0
    ? Math.round((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
    : 365;

  const title = spanDays <= 35 ? 'Portfolio Value — Last Month'
    : spanDays <= 100 ? 'Portfolio Value — Last 3 Months'
    : spanDays <= 200 ? 'Portfolio Value — Last 6 Months'
    : spanDays <= 400 ? 'Portfolio Value — Last Year'
    : 'Portfolio Value — All Time';
    
  // Build a smart Y-axis domain based on the range
  const values = chartData.map((d) => d.portfolio);
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const dataMax = values.length > 0 ? Math.max(...values) : 0;
  const dataRange = dataMax - dataMin;

  let yMin: number;
  let yMax: number;
  let tickCount: number;

  if (spanDays <= 35) {
    // Last month: zoom in tightly, 500 padding, 500 steps
    const padding = Math.max(dataRange * 0.2, 500);
    yMin = Math.floor((dataMin - padding) / 500) * 500;
    yMax = Math.ceil((dataMax + padding) / 500) * 500;
    tickCount = Math.round((yMax - yMin) / 500) + 1;
  } else if (spanDays <= 100) {
    // Last 3 months: zoom in, 1k steps
    const padding = Math.max(dataRange * 0.2, 1000);
    yMin = Math.floor((dataMin - padding) / 1000) * 1000;
    yMax = Math.ceil((dataMax + padding) / 1000) * 1000;
    tickCount = Math.round((yMax - yMin) / 1000) + 1;
  } else if (spanDays <= 200) {
    // Last 6 months: 1k steps
    const padding = Math.max(dataRange * 0.15, 1000);
    yMin = Math.floor((dataMin - padding) / 1000) * 1000;
    yMax = Math.ceil((dataMax + padding) / 1000) * 1000;
    tickCount = Math.round((yMax - yMin) / 1000) + 1;
  } else if (spanDays <= 400) {
    // Last year: 1k steps
    const padding = Math.max(dataRange * 0.1, 1000);
    yMin = Math.floor((dataMin - padding) / 1000) * 1000;
    yMax = Math.ceil((dataMax + padding) / 1000) * 1000;
    tickCount = Math.round((yMax - yMin) / 1000) + 1;
  } else {
    // Max / multi-year: 2k steps, wider view
    const padding = Math.max(dataRange * 0.1, 2000);
    yMin = Math.floor((dataMin - padding) / 2000) * 2000;
    yMax = Math.ceil((dataMax + padding) / 2000) * 2000;
    tickCount = Math.round((yMax - yMin) / 2000) + 1;
  }

  yMin = Math.max(0, yMin);
  tickCount = Math.min(tickCount, 8); // never more than 8 ticks

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
                <YAxis
                  domain={[yMin, yMax]}
                  tickCount={tickCount}
                  tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                  width={45}
                />
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