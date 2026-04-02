'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const rawData = [
  { name: 'Financial Services', value: 29080.70 },
  { name: 'Food & Dining', value: 12243.25 },
  { name: 'Shopping & Retail', value: 9779.83 },
  { name: 'Transportation', value: 7549.08 },
  { name: 'Healthcare', value: 2080.49 },
  { name: 'Entertainment', value: 922.90 },
  { name: 'Utilities', value: 839.76 },
  { name: 'Government & Legal', value: 37.69 }
];

const total = rawData.reduce((sum, item) => sum + item.value, 0);
const chartData = rawData.map(item => ({
  ...item,
  percentage: ((item.value / total) * 100).toFixed(1)
}));

const colors = ['#06b6d4', '#f97316', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#6366f1'];

const chartConfig = {
  value: {
    label: 'Amount',
    color: 'hsl(var(--color-value))'
  }
} satisfies ChartConfig;

export default function PieStatsPage() {
  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='h-64 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey='value'
                label={({ percentage }) => `${percentage}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `€${(value as number).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
