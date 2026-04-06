'use client';

import * as React from 'react';
import { DateRangeValue, getDefaultDateRange } from './date-range-selector';
import type { Summary, CategoryBreakdown, Transaction, InvestmentTotals, Holding, InvestmentHistoryPoint } from '../utils/mock-data';

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
  investmentTotals: InvestmentTotals | null;
  investmentHoldings: Holding[];
  investmentHistory: InvestmentHistoryPoint[];
  investmentGranularity: 'daily' | 'weekly' | 'monthly';
  investmentReturnPct: number | null;
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
    investmentTotals: null,
    investmentHoldings: [],
    investmentHistory: [],
    investmentGranularity: 'daily',
    investmentReturnPct: null,
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
    // Investment prices are live from Yahoo Finance, so always use today's
    // date as the end — unlike transactions which are bounded by synthetic data.
    const today = new Date().toISOString().split('T')[0];
    const investQs = new URLSearchParams({ start: dateRange.start, end: today }).toString();

    Promise.all([
      fetch(`${API_BASE}/api/summary?${qs}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/categories?${qs}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/monthly-spending?${qs}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/transactions?${qs}&limit=5`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/investments`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/investments/history?${investQs}`).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([summary, catData, trendData, txData, investData, investHistData]) => {
      if (cancelled) return;
      setData({
        summary: summary,
        categories: catData?.categories ?? catData ?? [],
        spendingTrend: trendData?.data ?? [],
        spendingGranularity: trendData?.granularity ?? 'monthly',
        recentTransactions: txData?.transactions ?? [],
        investmentTotals: investData?.totals ?? null,
        investmentHoldings: investData?.holdings ?? [],
        investmentHistory: investHistData?.data ?? [],
        investmentGranularity: investHistData?.granularity ?? 'daily',
        investmentReturnPct: investHistData?.returnPct ?? null,
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
