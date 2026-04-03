'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatEuro } from '../utils/format';
import { fetchTransactions } from '../utils/api';
import { CATEGORIES } from '../utils/mock-data';
import type { Transaction } from '../utils/mock-data';
import { CategoryBadge } from './category-badge';
import { Icons } from '@/components/icons';
import {
  DateRangeSelector,
  getDefaultDateRange,
  type DateRangeValue,
} from './date-range-selector';

interface TransactionsTableProps {
  onAddClick?: () => void;
}

export function TransactionsTable({ onAddClick }: TransactionsTableProps) {
  // ── All filter state URL-driven via nuqs ──────────────────────────────
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [urlCategory, setUrlCategory] = useQueryState('category', parseAsString.withDefault(''));
  const [urlStart, setUrlStart] = useQueryState('start', parseAsString.withDefault(''));
  const [urlEnd, setUrlEnd] = useQueryState('end', parseAsString.withDefault(''));
  const [urlFilter, setUrlFilter] = useQueryState('filter', parseAsString.withDefault('all'));
  const [urlSearch, setUrlSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [urlMinAmt, setUrlMinAmt] = useQueryState('min', parseAsString.withDefault(''));
  const [urlMaxAmt, setUrlMaxAmt] = useQueryState('max', parseAsString.withDefault(''));
  const [urlSort, setUrlSort] = useQueryState('sort', parseAsString.withDefault('date-desc'));

  // ── Local UI state (mirrors URL but debounced for search) ─────────────
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Debounce search input → URL
  useEffect(() => {
    const t = setTimeout(() => { setUrlSearch(searchInput || null); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Sync URL search → local input (e.g. on back navigation)
  useEffect(() => { setSearchInput(urlSearch); }, [urlSearch]);

  // ── Date range derived from URL params ────────────────────────────────
  const dateRange: DateRangeValue = React.useMemo(() => {
    if (urlStart && urlEnd) {
      return { start: urlStart, end: urlEnd, preset: 'custom' as const };
    }
    return getDefaultDateRange();
  }, [urlStart, urlEnd]);

  const handleDateRangeChange = useCallback((val: DateRangeValue) => {
    setUrlStart(val.start);
    setUrlEnd(val.end);
    setPage(1);
  }, [setUrlStart, setUrlEnd, setPage]);

  // ── Data fetching ─────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 30;

  // Track whether this is the first render to avoid resetting page
  const isFirstRender = useRef(true);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchTransactions({
        page,
        limit: pageSize,
        search: urlSearch || undefined,
        filter: (urlFilter as 'all' | 'expense' | 'income') || 'all',
        category: urlCategory || undefined,
        start: dateRange.start,
        end: dateRange.end,
        sort: urlSort || undefined,
      });

      let filtered = result.transactions as Transaction[];

      // Client-side amount filtering (backend doesn't support min/max)
      const min = urlMinAmt ? parseFloat(urlMinAmt) : null;
      const max = urlMaxAmt ? parseFloat(urlMaxAmt) : null;
      if (min !== null || max !== null) {
        filtered = filtered.filter((t) => {
          const amt = Math.abs(t.amount);
          if (min !== null && amt < min) return false;
          if (max !== null && amt > max) return false;
          return true;
        });
      }

      setTransactions(filtered);
      setTotal(result.total);
    } finally {
      setIsLoading(false);
    }
  }, [page, urlSearch, urlFilter, urlCategory, dateRange.start, dateRange.end, urlMinAmt, urlMaxAmt, urlSort]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Reset to page 1 when any filter (except page itself) changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [urlSearch, urlFilter, urlCategory, dateRange.start, dateRange.end, urlMinAmt, urlMaxAmt]);

  // ── Table columns ─────────────────────────────────────────────────────
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Date',
      cell: ({ row }) => (
        <div className='text-sm font-medium'>{formatDate(row.getValue('timestamp'))}</div>
      ),
      enableSorting: true,
    },
    {
      id: 'merchant',
      header: 'Merchant',
      cell: ({ row }) => (
        <div className='flex flex-col gap-0.5'>
          <div className='text-sm font-medium'>{row.original.merchant_name}</div>
          <div className='hidden text-xs text-muted-foreground sm:block'>
            {row.original.description}
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <CategoryBadge category={String(row.original.predicted_category || row.original.category)} />
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <div className='text-right'>Amount</div>,
      cell: ({ row }) => {
        const amount = row.getValue('amount') as number;
        const isIncome = (row.original.predicted_category || row.original.category) === 'Income';
        return (
          <div className={`text-right text-sm font-semibold ${isIncome ? 'text-green-600 dark:text-green-400' : ''}`}>
            {isIncome ? '+' : '-'}{formatEuro(Math.abs(amount))}
          </div>
        );
      },
      enableSorting: true,
    },
  ];

  const { table } = useDataTable({
    data: transactions,
    columns,
    pageCount: Math.ceil(total / pageSize),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const hasActiveFilters = urlCategory || urlFilter !== 'all' || urlSearch || urlMinAmt || urlMaxAmt;

  const SORT_OPTIONS = [
    { value: 'date-desc', label: 'Date: newest first' },
    { value: 'date-asc', label: 'Date: oldest first' },
    { value: 'amount-desc', label: 'Amount: highest first' },
    { value: 'amount-asc', label: 'Amount: lowest first' },
  ] as const;

  const sortLabel = SORT_OPTIONS.find((o) => o.value === urlSort)?.label ?? 'Date: newest first';

  const clearFilters = () => {
    setUrlSearch(null);
    setUrlFilter(null);
    setUrlCategory(null);
    setUrlMinAmt(null);
    setUrlMaxAmt(null);
    setUrlSort(null);
    setSearchInput('');
  };

  return (
    <div className='flex flex-col gap-4'>
      {/* Date Range */}
      <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />

      {/* Toolbar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='flex-1'>
          <Input
            placeholder='Search by merchant or description...'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className='h-9'
          />
        </div>
        <div className='flex gap-2'>
          {(['all', 'expense', 'income'] as const).map((type) => (
            <Button
              key={type}
              variant={urlFilter === type ? 'default' : 'outline'}
              size='sm'
              onClick={() => setUrlFilter(type === 'all' ? null : type)}
              className='capitalize'
            >
              {type === 'all' ? 'All' : type === 'expense' ? 'Expenses' : 'Income'}
            </Button>
          ))}
        </div>
        <Select
          value={urlCategory || 'all'}
          onValueChange={(v) => setUrlCategory(v === 'all' ? null : v)}
        >
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='All categories' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount Filter + Sort */}
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground whitespace-nowrap'>Amount:</span>
        <Input
          type='number'
          placeholder='Min €'
          value={urlMinAmt}
          onChange={(e) => setUrlMinAmt(e.target.value || null)}
          className='h-8 w-24'
        />
        <span className='text-sm text-muted-foreground'>–</span>
        <Input
          type='number'
          placeholder='Max €'
          value={urlMaxAmt}
          onChange={(e) => setUrlMaxAmt(e.target.value || null)}
          className='h-8 w-24'
        />
        {hasActiveFilters && (
          <Button variant='ghost' size='sm' onClick={clearFilters} className='h-8 text-xs'>
            Clear filters
          </Button>
        )}
        <div className='ml-auto'>
          <Select value={urlSort} onValueChange={(v) => setUrlSort(v)}>
            <SelectTrigger className='h-8 w-[210px] text-xs'>
              <SelectValue>{sortLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className='flex flex-col h-[calc(100vh-380px)] min-h-[400px]'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center'>
            <Icons.spinner className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : transactions.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center'>
            <Icons.search className='mb-3 h-12 w-12 text-muted-foreground' />
            <p className='text-muted-foreground'>No transactions found</p>
          </div>
        ) : (
          <DataTable table={table} />
        )}
      </div>
    </div>
  );
}
