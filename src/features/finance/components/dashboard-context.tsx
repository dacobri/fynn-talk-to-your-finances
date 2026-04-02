'use client';

import * as React from 'react';
import { DateRangeValue, getDefaultDateRange } from './date-range-selector';
import type { Summary, CategoryBreakdown, Transaction } from '../utils/mock-data';

export interface SpendingDataPoint {
  label: string;
  amount: number;
}

interface DashboardData {
  summary: Summary | null;
  categories: CategoryBreakdown[];
  spendingTrend: SpendingDataPoint[];
  spendingGranularity: 'daily' | 'weekly' | 'monthly';
  recentTransactions: Transaction[];
  loading: boolean;
}

interface DashboardContextValue {
  dateRange: DateRangeValue;
  setDateRange: (value: DateRangeValue) => void;
  data: DashboardData;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = React.useState<DateRangeValue>(getDefaultDateRange);

  const [data, setData] = React.useState<DashboardData>({
    summary: null,
    categories: [],
    spendingTrend: [],
    spendingGranularity: 'monthly',
    recentTransactions: [],
    loading: true,
  });

  // Fire-and-forget: ensure subscription cache is populated on first load
  const subsDetected = React.useRef(false);
  React.useEffect(() => {
    if (subsDetected.current) return;
    subsDetected.current = true;
    fetch(`${API_BASE}/api/subscriptions/detect`, { method: 'POST' }).catch(() => {});
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setData((prev) => ({ ...prev, loading: true }));

    const qs = new URLSearchParams({ start: dateRange.start, end: dateRange.end }).toString();

    Promise.all([
      fetch(`${API_BASE}/api/summary?${qs}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/categories?${qs}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/monthly-spending?${qs}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/transactions?${qs}&limit=8`).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([summary, catData, trendData, txData]) => {
      if (cancelled) return;
      setData({
        summary: summary,
        categories: catData?.categories ?? catData ?? [],
        spendingTrend: trendData?.data ?? [],
        spendingGranularity: trendData?.granularity ?? 'monthly',
        recentTransactions: txData?.transactions ?? [],
        loading: false,
      });
    });

    return () => { cancelled = true; };
  }, [dateRange.start, dateRange.end]);

  return (
    <DashboardContext.Provider value={{ dateRange, setDateRange, data }}>
      {children}
    </DashboardContext.Provider>
  );
}
