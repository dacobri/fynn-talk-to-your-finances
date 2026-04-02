'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useDashboard } from '@/features/finance/components/dashboard-context';
import { Skeleton } from '@/components/ui/skeleton';

const GRANULARITY_TITLES: Record<string, string> = {
  daily: 'Daily Spending',
  weekly: 'Weekly Spending Trend',
  monthly: 'Monthly Spending Trend',
};

const chartConfig = {
  spending: {
    label: 'Spending',
    color: 'hsl(0, 84%, 60%)'
  }
} satisfies ChartConfig;

export default function AreaStatsPage() {
  const { data } = useDashboard();

  const chartData = data.spendingTrend.map((item) => ({
    label: item.label,
    spending: item.amount,
  }));

  const average = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.spending, 0) / chartData.length
    : 0;

  const title = GRANULARITY_TITLES[data.spendingGranularity] || 'Spending Trend';

  return (
    <Card className='@container/card'>
      <CardHeader className='py-2'>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='pb-3'>
        {data.loading ? (
          <Skeleton className='h-[155px] w-full' />
        ) : chartData.length === 0 ? (
          <div className='flex h-[155px] items-center justify-center text-sm text-muted-foreground'>
            No spending data for this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className='w-full' style={{ height: '155px' }}>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData} margin={{ top: 8, right: 70, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id='colorSpending' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='hsl(0, 84%, 60%)' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='hsl(0, 84%, 60%)' stopOpacity={0.1} />
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
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `€${(value as number).toFixed(2)}`}
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
                  dataKey='spending'
                  stroke='hsl(0, 84%, 60%)'
                  fillOpacity={1}
                  fill='url(#colorSpending)'
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
