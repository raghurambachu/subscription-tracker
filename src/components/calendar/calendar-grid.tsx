import * as React from 'react';
import { useAppState } from '@/hooks/use-app-state';
import {
  getOccurrencesForMonth,
  isSameDay,
  toISODate,
  WEEKDAY_NAMES_SHORT,
  formatINR,
} from '@/lib/date-utils';
import type { BillingOccurrence } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Star, Sparkles, PackageCheck, Plus } from 'lucide-react';

interface CalendarGridProps {
  monthDate: Date;
  onSelectSubscription: (id: string) => void;
  onSelectDate: (dateISO: string) => void;
}

interface DayCell {
  date: Date;
  inMonth: boolean;
  occurrences: BillingOccurrence[];
}

function buildMonthCells(monthDate: Date, occurrences: BillingOccurrence[]): DayCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];

  // Leading days from previous month
  for (let i = startWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i);
    cells.push({ date, inMonth: false, occurrences: [] });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = toISODate(date);
    const dayOccurrences = occurrences.filter((o) => o.date === iso);
    cells.push({ date, inMonth: true, occurrences: dayOccurrences });
  }

  // Trailing days to fill grid to multiple of 7
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    for (let d = 1; d <= trailing; d++) {
      const date = new Date(year, month + 1, d);
      cells.push({ date, inMonth: false, occurrences: [] });
    }
  }

  return cells;
}

function highlightIcon(flag: string) {
  if (flag === 'annual') return <Star className="size-2.5" />;
  if (flag === 'trial') return <Sparkles className="size-2.5" />;
  if (flag === 'one-time') return <PackageCheck className="size-2.5" />;
  return null;
}

export function CalendarGrid({ monthDate, onSelectSubscription, onSelectDate }: CalendarGridProps) {
  const { data } = useAppState();

  const visibleSubs = React.useMemo(
    () =>
      data.subscriptions.filter(
        (s) => data.selectedListId === 'all' || s.listId === data.selectedListId
      ),
    [data.subscriptions, data.selectedListId]
  );

  const occurrences = React.useMemo(
    () => getOccurrencesForMonth(visibleSubs, monthDate.getFullYear(), monthDate.getMonth()),
    [visibleSubs, monthDate]
  );

  const cells = React.useMemo(() => buildMonthCells(monthDate, occurrences), [monthDate, occurrences]);

  const today = new Date();
  const categoryById = React.useMemo(() => {
    const map = new Map<string, (typeof data.categories)[number]>();
    data.categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [data.categories]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_NAMES_SHORT.map((d) => (
          <div key={d} className="px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-base-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, i) => {
          const isToday = isSameDay(cell.date, today);
          const dayTotal = cell.occurrences
            .filter((o) => o.subscription.status === 'active')
            .reduce((sum, o) => sum + o.subscription.amount, 0);
          const iso = toISODate(cell.date);
          const hasOccurrences = cell.occurrences.length > 0;

          const dayButton = (
            <button
              disabled={!cell.inMonth}
              onClick={!hasOccurrences && cell.inMonth ? () => onSelectDate(iso) : undefined}
              className={cn(
                'group relative flex h-[104px] flex-col rounded-[var(--radius-md)] border p-2.5 text-left transition-all',
                cell.inMonth
                  ? 'border-base-700 bg-base-850 hover:border-violet/50'
                  : 'border-transparent bg-transparent opacity-30',
                isToday && 'border-violet/60 bg-violet-soft pulse-today',
                !cell.inMonth && 'cursor-default'
              )}
            >
              <span className="flex items-center justify-between">
                <span
                  className={cn(
                    'font-mono-num text-[13px]',
                    cell.inMonth ? 'text-base-300' : 'text-base-500',
                    isToday && 'font-bold text-violet'
                  )}
                >
                  {cell.date.getDate()}
                </span>
                {cell.inMonth && !hasOccurrences && (
                  <Plus className="size-3.5 text-base-500 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </span>

              {hasOccurrences && (
                <>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {cell.occurrences.slice(0, 6).map((o, idx) => {
                      const cat = categoryById.get(o.subscription.categoryId);
                      const isCanceled = o.subscription.status === 'canceled';
                      return (
                        <span
                          key={o.subscription.id + idx}
                          className={cn(
                            'coin-dot flex size-[18px] items-center justify-center rounded-full text-white shadow-sm',
                            isCanceled && 'opacity-35 grayscale'
                          )}
                          style={{
                            backgroundColor: cat?.color ?? 'var(--color-base-400)',
                            animationDelay: `${idx * 60}ms`,
                          }}
                        >
                          {highlightIcon(o.subscription.highlight)}
                        </span>
                      );
                    })}
                    {cell.occurrences.length > 6 && (
                      <span className="flex size-[18px] items-center justify-center rounded-full bg-base-600 text-[9px] font-semibold text-base-200">
                        +{cell.occurrences.length - 6}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto font-mono-num text-[11px] font-medium text-base-200">
                    {dayTotal > 0 ? formatINR(dayTotal) : ''}
                  </div>
                </>
              )}
            </button>
          );

          if (!hasOccurrences) {
            return <React.Fragment key={i}>{dayButton}</React.Fragment>;
          }

          return (
            <Popover key={i}>
              <PopoverTrigger asChild>{dayButton}</PopoverTrigger>

              <PopoverContent>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold">
                    {cell.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {cell.occurrences.map((o, idx) => {
                    const cat = categoryById.get(o.subscription.categoryId);
                    return (
                      <button
                        key={o.subscription.id + idx}
                        onClick={() => onSelectSubscription(o.subscription.id)}
                        className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-base-700"
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm" title={o.subscription.name}>
                          {o.subscription.name}
                        </span>
                        {o.subscription.highlight !== 'none' && (
                          <Badge variant="amber" className="shrink-0">
                            {o.subscription.highlight}
                          </Badge>
                        )}
                        {o.subscription.status === 'canceled' && (
                          <Badge variant="coral" className="shrink-0">canceled</Badge>
                        )}
                        <span className="font-mono-num text-sm text-base-200 shrink-0">
                          {formatINR(o.subscription.amount)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => onSelectDate(iso)}
                  className="mt-2 flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-base-600 px-2 py-1.5 text-left text-sm text-base-300 transition-colors hover:border-violet/50 hover:bg-base-700 hover:text-base-50"
                >
                  <Plus className="size-3.5" />
                  Add subscription for this day
                </button>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
}
