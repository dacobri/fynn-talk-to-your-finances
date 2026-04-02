'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useDashboard } from '@/features/finance/components/dashboard-context';

const categoryColors: Record<string, string> = {
  'Shopping & Retail': 'bg-purple-500/10 text-purple-500',
  'Food & Dining': 'bg-orange-500/10 text-orange-500',
  'Transportation': 'bg-pink-500/10 text-pink-500',
  'Income': 'bg-green-500/10 text-green-500',
  'Financial Services': 'bg-cyan-500/10 text-cyan-500',
  'Healthcare': 'bg-emerald-500/10 text-emerald-500',
  'Healthcare & Medical': 'bg-emerald-500/10 text-emerald-500',
  'Entertainment': 'bg-amber-500/10 text-amber-500',
  'Entertainment & Recreation': 'bg-amber-500/10 text-amber-500',
  'Utilities': 'bg-blue-500/10 text-blue-500',
  'Utilities & Services': 'bg-blue-500/10 text-blue-500',
  'Government & Legal': 'bg-indigo-500/10 text-indigo-500',
  'Charity & Donations': 'bg-rose-500/10 text-rose-500',
};

function formatDate(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SalesPage() {
  const { data } = useDashboard();
  const transactions = data.recentTransactions;

  return (
    <Card className='@container/card'>
      <CardHeader className='py-2'>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        {data.loading ? (
          <div className='space-y-3 px-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-8 w-full' />
            ))}
          </div>
        ) : (
          <div className='space-y-1'>
            {transactions.map((tx, idx) => {
              const isIncome = tx.category === 'Income' || tx.amount > 0;
              const displayAmount = Math.abs(tx.amount);
              return (
                <div key={tx.id || idx} className='flex items-center justify-between border-t px-6 py-1.5 first:border-t-0'>
                  <div className='flex flex-1 flex-col'>
                    <span className='text-sm font-medium'>{tx.merchant_name}</span>
                    <span className='text-xs text-muted-foreground'>{formatDate(tx.timestamp)}</span>
                  </div>
                  <Badge variant='outline' className={categoryColors[tx.category] || 'bg-slate-500/10 text-slate-500'}>
                    {tx.category}
                  </Badge>
                  <span
                    className={`ml-2 font-mono text-sm font-medium ${
                      isIncome ? 'text-green-500' : 'text-inherit'
                    }`}
                  >
                    {isIncome ? '+' : '-'}€{displayAmount.toFixed(2)}
                  </span>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <p className='px-6 py-4 text-sm text-muted-foreground'>No transactions in this period.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className='border-t pt-3 pb-16'>
        <Link href='/dashboard/transactions' className='text-sm font-medium text-primary hover:underline'>
          View all transactions →
        </Link>
      </CardFooter>
    </Card>
  );
}
