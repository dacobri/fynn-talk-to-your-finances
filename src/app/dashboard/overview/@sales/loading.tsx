import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        <div className='space-y-1'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='flex items-center justify-between border-t px-6 py-3 first:border-t-0'>
              <div className='flex flex-1 flex-col gap-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-3 w-16' />
              </div>
              <Skeleton className='h-6 w-20' />
              <Skeleton className='h-4 w-20' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
