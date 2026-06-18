import * as React from 'react';
import { useAppState } from '@/hooks/use-app-state';
import {
  getNextBillingDate,
  daysUntil,
  toISODate,
} from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Star, Sparkles, PackageCheck, Bell } from 'lucide-react';

interface UpcomingRailProps {
  onSelectSubscription: (id: string) => void;
}

function highlightIcon(flag: string) {
  if (flag === 'annual') return <Star className="size-3" />;
  if (flag === 'trial') return <Sparkles className="size-3" />;
  if (flag === 'one-time') return <PackageCheck className="size-3" />;
  return null;
}

export function UpcomingRail({ onSelectSubscription }: UpcomingRailProps) {
  const { data, formatMoney } = useAppState();

  const upcoming = React.useMemo(() => {
    const now = new Date();
    const subs = data.subscriptions.filter(
      (s) =>
        s.status === 'active' &&
        (data.selectedListId === 'all' || s.listId === data.selectedListId)
    );

    const withNextDate = subs
      .map((s) => {
        const isRecurring = s.billingCycle === 'monthly' || s.billingCycle === 'yearly' || s.billingCycle === 'custom';
        const next = getNextBillingDate(s, now, { excludeToday: isRecurring });
        return next ? { sub: s, nextDate: toISODate(next) } : null;
      })
      .filter((x): x is { sub: typeof subs[number]; nextDate: string } => x !== null)
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate));

    return withNextDate.slice(0, 8);
  }, [data.subscriptions, data.selectedListId]);

  const categoryById = React.useMemo(() => {
    const map = new Map<string, (typeof data.categories)[number]>();
    data.categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [data.categories]);

  if (upcoming.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-base-700 p-8 text-center">
        <Bell className="size-6 text-base-500" />
        <p className="text-sm text-base-400">No upcoming charges yet. Add a subscription to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-base-400">
        Upcoming
      </div>
      {upcoming.map(({ sub, nextDate }) => {
        const cat = categoryById.get(sub.categoryId);
        const days = daysUntil(nextDate);
        const isUrgent = days <= 1;
        return (
          <button
            key={sub.id}
            onClick={() => onSelectSubscription(sub.id)}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-base-700 bg-base-850 px-3 py-2.5 text-left transition-colors hover:border-base-500 hover:bg-base-800"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: cat?.color ?? 'var(--color-base-400)' }}
            >
              {highlightIcon(sub.highlight) ?? (
                <span className="text-[11px] font-semibold">{sub.name.charAt(0).toUpperCase()}</span>
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm font-medium text-base-50">{sub.name}</span>
              <span className="block text-[11px] text-base-400">
                {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1 shrink-0">
              <span className="font-mono-num text-sm font-medium text-base-100">{formatMoney(sub.amount)}</span>
              {isUrgent && <Badge variant="coral">{days === 0 ? 'today' : 'tomorrow'}</Badge>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
