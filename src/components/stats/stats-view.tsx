import * as React from 'react';
import { useAppState } from '@/hooks/use-app-state';
import { getAnnualizedCost, getMonthlyCost, formatINR, MONTH_NAMES_SHORT } from '@/lib/date-utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Wallet, CalendarRange, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Recharts renders tooltips as plain HTML and SVG fill/stroke as CSS-resolved attributes,
// so CSS custom properties work directly here and stay in sync with the live theme
// without needing to read computed values in JS.
const CHART_COLORS = {
  tooltipBg: 'var(--color-base-800)',
  tooltipBorder: 'var(--color-base-600)',
  tooltipText: 'var(--color-base-50)',
  gridStroke: 'var(--color-base-700)',
  axisStroke: 'var(--color-base-400)',
  fallbackDot: 'var(--color-base-400)',
  violet: 'var(--color-violet)',
  amber: 'var(--color-amber)',
  cursorFill: 'var(--color-base-100)',
};

export function StatsView() {
  const { data } = useAppState();
  const chartColors = CHART_COLORS;

  const activeSubs = React.useMemo(
    () =>
      data.subscriptions.filter(
        (s) => s.status === 'active' && (data.selectedListId === 'all' || s.listId === data.selectedListId)
      ),
    [data.subscriptions, data.selectedListId]
  );

  const yearlyTotal = React.useMemo(
    () => activeSubs.reduce((sum, s) => sum + getAnnualizedCost(s), 0),
    [activeSubs]
  );
  const monthlyAvg = yearlyTotal / 12;

  const categoryById = React.useMemo(() => {
    const map = new Map<string, (typeof data.categories)[number]>();
    data.categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [data.categories]);

  const byCategory = React.useMemo(() => {
    const totals = new Map<string, number>();
    activeSubs.forEach((s) => {
      const current = totals.get(s.categoryId) ?? 0;
      totals.set(s.categoryId, current + getAnnualizedCost(s));
    });
    return Array.from(totals.entries())
      .map(([categoryId, value]) => ({
        categoryId,
        name: categoryById.get(categoryId)?.name ?? 'Other',
        color: categoryById.get(categoryId)?.color ?? chartColors.fallbackDot,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeSubs, categoryById]);

  // Peak spending months: simulate a 12-month forward calendar of actual charges
  const monthlyBreakdown = React.useMemo(() => {
    const now = new Date();
    const months: { label: string; total: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({ label: MONTH_NAMES_SHORT[monthDate.getMonth()], total: 0 });
    }

    activeSubs.forEach((s) => {
      if (s.billingCycle === 'monthly') {
        for (let i = 0; i < 12; i++) months[i].total += s.amount;
      } else if (s.billingCycle === 'yearly') {
        // find which month index it lands on within the next 12 months
        const start = new Date(s.startDate);
        const billMonth = start.getMonth();
        const now2 = new Date();
        for (let i = 0; i < 12; i++) {
          const d = new Date(now2.getFullYear(), now2.getMonth() + i, 1);
          if (d.getMonth() === billMonth) months[i].total += s.amount;
        }
      } else if (s.billingCycle === 'custom' && s.customIntervalDays) {
        const monthlyEquivalent = (s.amount * 30) / s.customIntervalDays;
        for (let i = 0; i < 12; i++) months[i].total += monthlyEquivalent;
      }
    });

    return months;
  }, [activeSubs]);

  const peakMonth = React.useMemo(() => {
    if (monthlyBreakdown.every((m) => m.total === 0)) return null;
    return monthlyBreakdown.reduce((max, m) => (m.total > max.total ? m : max), monthlyBreakdown[0]);
  }, [monthlyBreakdown]);

  const totalActiveCount = activeSubs.length;

  if (data.subscriptions.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-base-700 text-center">
        <TrendingUp className="size-8 text-base-500" />
        <p className="font-display text-base font-medium text-base-100">No data to show yet</p>
        <p className="max-w-sm text-sm text-base-400">
          Once you add subscriptions, you'll see your projected yearly budget, category breakdown, and peak spending months here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-base-400">
              <Wallet className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Yearly budget</span>
            </div>
            <div className="mt-2 font-display text-2xl font-semibold text-base-50">{formatINR(yearlyTotal)}</div>
            <div className="mt-0.5 text-[11px] text-base-400">projected over 12 months</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-base-400">
              <CalendarRange className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Avg. monthly</span>
            </div>
            <div className="mt-2 font-display text-2xl font-semibold text-base-50">{formatINR(monthlyAvg)}</div>
            <div className="mt-0.5 text-[11px] text-base-400">average cost per month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-base-400">
              <Crown className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Peak month</span>
            </div>
            <div className="mt-2 font-display text-2xl font-semibold text-base-50">
              {peakMonth ? peakMonth.label : '—'}
            </div>
            <div className="mt-0.5 text-[11px] text-base-400">
              {peakMonth ? formatINR(peakMonth.total) : 'no recurring charges'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-base-400">
              <TrendingUp className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active subs</span>
            </div>
            <div className="mt-2 font-display text-2xl font-semibold text-base-50">{totalActiveCount}</div>
            <div className="mt-0.5 text-[11px] text-base-400">
              across {data.selectedListId === 'all' ? data.lists.length : 1} list{data.selectedListId === 'all' && data.lists.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Spend by category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-base-400">
                No active subscriptions
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-[240px] w-[240px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        cornerRadius={6}
                        strokeWidth={0}
                      >
                        {byCategory.map((entry) => (
                          <Cell key={entry.categoryId} fill={entry.color} />
                        ))}
                      </Pie>
                      <RTooltip
                        formatter={(value) => formatINR(Number(value))}
                        contentStyle={{
                          backgroundColor: chartColors.tooltipBg,
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          borderRadius: 8,
                          fontSize: 12,
                          color: chartColors.tooltipText,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto max-h-[240px] scrollbar-none">
                  {byCategory.map((c) => (
                    <div key={c.categoryId} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 truncate text-base-200">{c.name}</span>
                      <span className="font-mono-num text-base-50">{formatINR(c.value)}</span>
                      <span className="w-10 shrink-0 text-right text-[11px] text-base-400">
                        {Math.round((c.value / yearlyTotal) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by month (next 12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBreakdown} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={chartColors.axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={chartColors.axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  <RTooltip
                    formatter={(value) => formatINR(Number(value))}
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: chartColors.tooltipText,
                    }}
                    cursor={{ fill: chartColors.cursorFill, opacity: 0.06 }}
                  />
                  <Bar dataKey="total" radius={[5, 5, 0, 0]}>
                    {monthlyBreakdown.map((m, i) => (
                      <Cell
                        key={i}
                        fill={
                          peakMonth && m.label === peakMonth.label && m.total === peakMonth.total
                            ? chartColors.amber
                            : chartColors.violet
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.selectedListId === 'all' && data.lists.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Lists comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {data.lists.map((list) => {
                const listSubs = data.subscriptions.filter((s) => s.listId === list.id && s.status === 'active');
                const listYearly = listSubs.reduce((sum, s) => sum + getAnnualizedCost(s), 0);
                const pct = yearlyTotal > 0 ? (listYearly / yearlyTotal) * 100 : 0;
                return (
                  <div key={list.id} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 truncate text-sm text-base-200" title={list.name}>
                      {list.name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-base-700">
                      <div
                        className={cn('h-full rounded-full')}
                        style={{ width: `${pct}%`, backgroundColor: list.color }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right font-mono-num text-sm text-base-50">
                      {formatINR(listYearly)}/yr
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
