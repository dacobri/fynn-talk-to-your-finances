'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboard } from '@/features/finance/components/dashboard-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

const CATEGORY_FILLS: Record<string, string> = {
  'Financial Services': '#06b6d4',
  'Food & Dining': '#f97316',
  'Shopping & Retail': '#8b5cf6',
  'Transportation': '#ec4899',
  'Healthcare': '#10b981',
  'Healthcare & Medical': '#10b981',
  'Entertainment': '#f59e0b',
  'Entertainment & Recreation': '#f59e0b',
  'Utilities': '#3b82f6',
  'Utilities & Services': '#3b82f6',
  'Government & Legal': '#6366f1',
  'Charity & Donations': '#e11d48',
  'Income': '#22c55e',
};

const chartConfig = {
  amount: { label: 'Amount' }
} satisfies ChartConfig;

export default function BarStatsPage() {
  const { data, dateRange } = useDashboard();
  const router = useRouter();

  const chartData = data.categories
    .filter((c) => c.category !== 'Income')
    .map((c) => ({
      category: c.category,
      amount: c.amount,
      fill: CATEGORY_FILLS[c.category] || '#94a3b8',
    }));

  const handleBarClick = (entry: any) => {
    if (entry?.category) {
      const params = new URLSearchParams({
        category: entry.category,
        start: dateRange.start,
        end: dateRange.end,
      });
      router.push(`/dashboard/transactions?${params.toString()}`);
    }
  };

  return (
    <Card className='@container/card'>
      <CardHeader className='py-2'>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className='pb-3'>
        {data.loading ? (
          <Skeleton className='h-[255px] w-full' />
        ) : (
          <ChartContainer config={chartConfig} className='w-full' style={{ height: '255px' }}>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                layout='vertical'
                data={chartData}
                margin={{ top: 12, right: 24, left: 4, bottom: 4 }}
                barSize={22}
              >
                <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                <XAxis
                  type='number'
                  tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey='category'
                  type='category'
                  width={155}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`€${(value as number).toFixed(2)}`, 'Amount']}
                />
                <Bar
                  dataKey='amount'
                  radius={[0, 6, 6, 0]}
                  className='cursor-pointer'
                  onClick={(_data: any, index: number) => handleBarClick(chartData[index])}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
