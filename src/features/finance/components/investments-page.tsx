'use client';

import React, { useEffect, useState, useMemo } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { fetchInvestments, fetchInvestmentHistory } from '@/features/finance/utils/api';
import type { Holding, InvestmentTotals, InvestmentsResponse } from '@/features/finance/utils/mock-data';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Color palette for pie chart
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#6B7280', // Gray
  '#84CC16', // Lime
];

// Summary card component
function SummaryCard({
  title,
  value,
  isLoading,
  subtitle,
  subtitle2,
  icon: Icon,
}: {
  title: string;
  value: string;
  isLoading: boolean;
  subtitle?: string;
  subtitle2?: string;
  icon?: React.ComponentType<{ className: string }>;
}) {
  return (
    <Card className='h-full'>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-32 mb-2" />
            {subtitle && <Skeleton className="h-4 w-20" />}
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {subtitle2 && <p className="text-xs text-muted-foreground mt-0.5">{subtitle2}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Holdings table component
function HoldingsTable({ holdings, isLoading }: { holdings: Holding[]; isLoading: boolean }) {
  const [sortKey, setSortKey] = useState<string>('currentValueEur');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const handleHeaderClick = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedHoldings = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortKey) {
        case 'ticker':
          aVal = a.ticker;
          bVal = b.ticker;
          break;
        case 'currentValueEur':
          aVal = a.currentValueEur;
          bVal = b.currentValueEur;
          break;
        case 'returnEur':
          aVal = a.returnEur;
          bVal = b.returnEur;
          break;
        case 'returnPct':
          aVal = a.returnPct;
          bVal = b.returnPct;
          break;
        default:
          aVal = a.currentValueEur;
          bVal = b.currentValueEur;
      }

      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [holdings, sortKey, sortDir]);

  const getSortIndicator = (key: string) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  if (isLoading) {
    return (
      <Card style={{ height: '580px', overflow: 'auto' }}>
        <CardHeader>
          <CardTitle>Portfolio Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Icons.trendingUp className="h-8 w-8 mb-2 opacity-50" />
            <p>No holdings yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold w-8"></th>
                <th
                  className="text-left py-3 px-2 font-semibold cursor-pointer hover:bg-muted/50"
                  onClick={() => handleHeaderClick('ticker')}
                >
                  Ticker{getSortIndicator('ticker')}
                </th>
                <th className="text-left py-3 px-2 font-semibold">Company</th>
                <th className="text-left py-3 px-2 font-semibold">Type</th>
                <th className="text-right py-3 px-2 font-semibold tabular-nums">Qty</th>
                <th className="text-right py-3 px-2 font-semibold tabular-nums">Avg Price</th>
                <th className="text-right py-3 px-2 font-semibold tabular-nums">Current Price</th>
                <th className="text-right py-3 px-2 font-semibold tabular-nums">Today</th>
                <th
                  className="text-right py-3 px-2 font-semibold tabular-nums cursor-pointer hover:bg-muted/50"
                  onClick={() => handleHeaderClick('currentValueEur')}
                >
                  Value{getSortIndicator('currentValueEur')}
                </th>
                <th
                  className="text-right py-3 px-2 font-semibold tabular-nums cursor-pointer hover:bg-muted/50"
                  onClick={() => handleHeaderClick('returnEur')}
                >
                  Return{getSortIndicator('returnEur')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding) => {
                const isPositive = holding.returnEur >= 0;
                const returnColor = isPositive ? 'text-green-600' : 'text-red-600';
                const todayIsPositive = (holding.todayChangeEur ?? 0) >= 0;
                const todayColor = todayIsPositive ? 'text-green-600' : 'text-red-600';
                const isExpanded = expandedTicker === holding.ticker;

                return (
                  <React.Fragment key={holding.ticker}>
                    <tr
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => setExpandedTicker(isExpanded ? null : holding.ticker)}
                    >
                      <td className="py-3 px-2 text-center">
                        <span className="text-sm">{isExpanded ? '▾' : '▸'}</span>
                      </td>
                      <td className="py-3 px-2 font-medium">{holding.ticker}</td>
                      <td className="py-3 px-2">{holding.companyName}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">
                          {holding.assetType}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        {formatNumber(holding.quantity)}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        {formatEuro(holding.avgPurchasePrice)}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        {formatEuro(holding.currentPrice)}
                      </td>
                      <td className={`py-3 px-2 text-right tabular-nums ${todayColor}`}>
                        <div>{formatEuro(holding.todayChangeEur ?? 0)}</div>
                        <div className="text-xs opacity-75">
                          {todayIsPositive ? '+' : ''}
                          {formatNumber(holding.todayChangePct ?? 0)}%
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums font-medium">
                        {formatEuro(holding.currentValueEur)}
                      </td>
                      <td className={`py-3 px-2 text-right tabular-nums font-medium ${returnColor}`}>
                        <div>{formatEuro(holding.returnEur)}</div>
                        <div className="text-xs opacity-75">
                          {isPositive ? '+' : ''}
                          {formatNumber(holding.returnPct)}%
                        </div>
                      </td>
                    </tr>
                    {isExpanded && holding.orders && holding.orders.length > 0 && (
                      <>
                        {holding.orders.map((order, idx) => {
                          const orderReturn =
                            ((holding.currentPrice - order.pricePerShare) / order.pricePerShare) * 100;
                          const orderReturnIsPositive = orderReturn >= 0;
                          const orderReturnColor = orderReturnIsPositive ? 'text-green-600' : 'text-red-600';

                          return (
                            <tr key={`${holding.ticker}-order-${idx}`} className="border-b hover:bg-muted/50 bg-muted/30">
                              <td className="py-2 px-2"></td>
                              <td colSpan={9} className="py-2 px-6">
                                <div className="grid grid-cols-5 gap-4 text-sm">
                                  <div>
                                    <div className="text-xs text-muted-foreground">Date</div>
                                    <div className="font-medium">{order.date}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Qty</div>
                                    <div className="font-medium">{formatNumber(order.quantity)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Price/Share</div>
                                    <div className="font-medium">{formatEuro(order.pricePerShare)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Total Cost</div>
                                    <div className="font-medium">{formatEuro(order.totalCost)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Order Return</div>
                                    <div className={`font-medium ${orderReturnColor}`}>
                                      {orderReturnIsPositive ? '+' : ''}
                                      {formatNumber(orderReturn)}%
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Allocation donut chart
function AllocationChart({ holdings, isLoading }: { holdings: Holding[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No data to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValueEur, 0);
  const chartData = holdings.map((holding) => ({
    name: holding.ticker,
    value: parseFloat((holding.currentValueEur / totalValue * 100).toFixed(2)),
    companyName: holding.companyName,
    currentValue: holding.currentValueEur,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={353}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-2 w-fit mx-auto">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex items-center gap-2 text-sm w-48">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.value.toFixed(2)}% ({formatEuro(item.currentValue)})
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
function AddOrderDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [assetType, setAssetType] = useState('ETF');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!ticker || !quantity || !price || !purchaseDate) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/investments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          company_name: companyName || ticker.toUpperCase(),
          asset_type: assetType,
          quantity: parseFloat(quantity),
          purchase_price: parseFloat(price),
          purchase_date: purchaseDate,
          currency,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(err.detail || 'Request failed');
      }
      setTicker(''); setCompanyName(''); setQuantity(''); setPrice(''); setPurchaseDate('');
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to add order');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='bg-background rounded-xl shadow-xl p-6 w-full max-w-md mx-4'>
        <h2 className='text-lg font-semibold mb-4'>Add Buy Order</h2>
        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='text-xs font-medium text-muted-foreground mb-1 block'>Ticker *</label>
              <input className='w-full h-9 rounded-md border border-input bg-background px-3 text-sm' placeholder='e.g. VWCE.DE' value={ticker} onChange={(e) => setTicker(e.target.value)} />
            </div>
            <div>
              <label className='text-xs font-medium text-muted-foreground mb-1 block'>Asset Type</label>
              <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className='w-full h-9 rounded-md border border-input bg-background px-3 text-sm'>
                <option value='ETF'>ETF</option>
                <option value='Stock'>Stock</option>
                <option value='Bond'>Bond</option>
                <option value='Crypto'>Crypto</option>
                <option value='Other'>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className='text-xs font-medium text-muted-foreground mb-1 block'>Company Name (optional)</label>
            <input className='w-full h-9 rounded-md border border-input bg-background px-3 text-sm' placeholder='e.g. Vanguard FTSE All-World' value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='text-xs font-medium text-muted-foreground mb-1 block'>Quantity *</label>
              <input type='number' className='w-full h-9 rounded-md border border-input bg-background px-3 text-sm' placeholder='e.g. 10.5' value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className='text-xs font-medium text-muted-foreground mb-1 block'>Price per Share *</label>
              <input type='number' className='w-full h-9 rounded-md border border-input bg-background px-3 text-sm' placeholder='e.g. 99.50' value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='text-xs font-medium text-muted-foreground mb-1 block'>Purchase Date *</label>
              <input type='date' className='w-full h-9 rounded-md border border-input bg-background px-3 text-sm' value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div>
              <label className='text-xs font-medium text-muted-foreground mb-1 block'>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className='w-full h-9 rounded-md border border-input bg-background px-3 text-sm'>
                <option value='EUR'>EUR</option>
                <option value='USD'>USD</option>
                <option value='GBP'>GBP</option>
              </select>
            </div>
          </div>
          {error && <p className='text-sm text-red-500'>{error}</p>}
        </div>
        <div className='flex gap-2 mt-5 justify-end'>
          <button onClick={onClose} disabled={loading} className='inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted'>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'>
            {loading ? 'Adding...' : 'Add Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvestmentsPageComponent() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totals, setTotals] = useState<InvestmentTotals>({
    invested: 0,
    currentValue: 0,
    returnEur: 0,
    returnPct: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [mwrPct, setMwrPct] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data: InvestmentsResponse = await fetchInvestments(true);
        setHoldings(data.holdings || []);
        setTotals(data.totals || {
          invested: 0,
          currentValue: 0,
          returnEur: 0,
          returnPct: 0,
        });

        // Fetch full-range history to get the Modified Dietz (MWR) return
        const histData = await fetchInvestmentHistory();
        if (histData && typeof (histData as Record<string, unknown>).returnPct === 'number') {
          setMwrPct((histData as Record<string, unknown>).returnPct as number);
        }
      } catch (error) {
        console.error('Failed to load investments:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const isPositiveReturn = totals.returnEur >= 0;

  return (
    <PageContainer
      scrollable
      pageTitle="Investments"
      pageDescription="Track your investment portfolio performance."
      pageHeaderAction={
        <button
          onClick={() => setAddOrderOpen(true)}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Add Buy Order
        </button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Total Invested"
            value={formatEuro(totals.invested)}
            isLoading={isLoading}
            icon={Icons.creditCard}
          />
          <SummaryCard
            title="Current Value"
            value={formatEuro(totals.currentValue)}
            isLoading={isLoading}
            icon={Icons.trendingUp}
          />
          <SummaryCard
            title="Total Return"
            value={formatEuro(totals.returnEur)}
            isLoading={isLoading}
            subtitle={`${isPositiveReturn ? '+' : ''}${formatNumber(totals.returnPct)}% · Simple return`}
            subtitle2={mwrPct !== null ? `${mwrPct >= 0 ? '+' : ''}${mwrPct.toFixed(1)}% · Time-weighted (MWR)` : undefined}
            icon={isPositiveReturn ? Icons.trendingUp : Icons.trendingDown}
          />
        </div>

        {/* Holdings Table and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 self-start">
            <HoldingsTable holdings={holdings} isLoading={isLoading} />
          </div>
          <div>
            <AllocationChart holdings={holdings} isLoading={isLoading} />
          </div>
        </div>
      </div>
      <AddOrderDialog
        open={addOrderOpen}
        onClose={() => setAddOrderOpen(false)}
        onAdded={() => {
          setIsLoading(true);
          Promise.all([fetchInvestments(true), fetchInvestmentHistory()]).then(([data, histData]) => {
            setHoldings(data.holdings || []);
            setTotals(data.totals || { invested: 0, currentValue: 0, returnEur: 0, returnPct: 0 });
            if (histData && typeof (histData as Record<string, unknown>).returnPct === 'number') {
              setMwrPct((histData as Record<string, unknown>).returnPct as number);
            }
            setIsLoading(false);
          });
        }}
      />
    </PageContainer>
  );
}
