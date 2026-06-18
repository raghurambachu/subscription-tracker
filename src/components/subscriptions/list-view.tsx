import * as React from 'react';
import { useAppState } from '@/hooks/use-app-state';
import {
  formatINR,
  getNextBillingDate,
  toISODate,
  getMonthlyCost,
} from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowUpDown,
  Star,
  Sparkles,
  PackageCheck,
  Pencil,
  Ban,
  CheckCircle,
  Trash2,
  Inbox,
} from 'lucide-react';
import type { Subscription } from '@/lib/types';

type SortKey = 'name' | 'amount' | 'nextDate' | 'category';

interface ListViewProps {
  onEdit: (id: string) => void;
  onAddNew: () => void;
}

function highlightBadge(flag: Subscription['highlight']) {
  if (flag === 'none') return null;
  const icon =
    flag === 'annual' ? <Star className="size-3" /> : flag === 'trial' ? <Sparkles className="size-3" /> : <PackageCheck className="size-3" />;
  return (
    <Badge variant="amber" className="gap-1">
      {icon}
      {flag}
    </Badge>
  );
}

const CYCLE_LABEL: Record<Subscription['billingCycle'], string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  'one-time': 'One-time',
  trial: 'Trial',
  custom: 'Custom',
};

export function ListView({ onEdit, onAddNew }: ListViewProps) {
  const { data, deleteSubscription, toggleStatus } = useAppState();
  const [sortKey, setSortKey] = React.useState<SortKey>('nextDate');
  const [sortAsc, setSortAsc] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'canceled'>('all');

  const categoryById = React.useMemo(() => {
    const map = new Map<string, (typeof data.categories)[number]>();
    data.categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [data.categories]);

  const subs = React.useMemo(() => {
    let list = data.subscriptions.filter(
      (s) => data.selectedListId === 'all' || s.listId === data.selectedListId
    );
    if (statusFilter !== 'all') list = list.filter((s) => s.status === statusFilter);

    const withNext = list.map((s) => {
      const isRecurring = s.billingCycle === 'monthly' || s.billingCycle === 'yearly' || s.billingCycle === 'custom';
      const next = getNextBillingDate(s, new Date(), { excludeToday: isRecurring });
      return { sub: s, nextDate: next ? toISODate(next) : '9999-99-99' };
    });

    withNext.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.sub.name.localeCompare(b.sub.name);
      else if (sortKey === 'amount') cmp = getMonthlyCost(a.sub) - getMonthlyCost(b.sub);
      else if (sortKey === 'nextDate') cmp = a.nextDate.localeCompare(b.nextDate);
      else if (sortKey === 'category') {
        const ca = categoryById.get(a.sub.categoryId)?.name ?? '';
        const cb = categoryById.get(b.sub.categoryId)?.name ?? '';
        cmp = ca.localeCompare(cb);
      }
      return sortAsc ? cmp : -cmp;
    });

    return withNext;
  }, [data.subscriptions, data.selectedListId, sortKey, sortAsc, statusFilter, categoryById]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn(
        'flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
        sortKey === k ? 'text-base-100' : 'text-base-400 hover:text-base-200'
      )}
    >
      {label}
      <ArrowUpDown className="size-3" />
    </button>
  );

  if (data.subscriptions.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-base-700 text-center">
        <Inbox className="size-8 text-base-500" />
        <p className="font-display text-base font-medium text-base-100">No subscriptions yet</p>
        <p className="max-w-sm text-sm text-base-400">
          Add your first subscription to start tracking renewals, trials, and spending.
        </p>
        <Button onClick={onAddNew} variant="gradient" className="mt-1">
          Add subscription
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {(['all', 'active', 'canceled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn(
              'rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-colors',
              statusFilter === f ? 'bg-violet text-white' : 'bg-base-800 text-base-300 hover:bg-base-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-base-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-base-700 bg-base-850">
              <th className="px-4 py-3 text-left"><SortHeader label="Name" k="name" /></th>
              <th className="px-4 py-3 text-left"><SortHeader label="Category" k="category" /></th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-base-400">Cycle</th>
              <th className="px-4 py-3 text-left"><SortHeader label="Next billing" k="nextDate" /></th>
              <th className="px-4 py-3 text-right"><SortHeader label="Amount" k="amount" /></th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-base-400">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {subs.map(({ sub, nextDate }, idx) => {
              const cat = categoryById.get(sub.categoryId);
              const isCanceled = sub.status === 'canceled';
              return (
                <tr
                  key={sub.id}
                  className={cn(
                    'border-b border-base-700/60 bg-base-900 transition-colors hover:bg-base-850/80',
                    idx === subs.length - 1 && 'border-b-0',
                    isCanceled && 'opacity-50'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="max-w-[220px] truncate font-medium text-sm text-base-50" title={sub.name}>
                        {sub.name}
                      </span>
                      <span className="shrink-0">{highlightBadge(sub.highlight)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-base-300">
                      <span className="size-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                      {cat?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-base-300">
                    {CYCLE_LABEL[sub.billingCycle]}
                    {sub.billingCycle === 'custom' && sub.customIntervalDays
                      ? ` (${sub.customIntervalDays}d)`
                      : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-base-300 font-mono-num">
                    {nextDate === '9999-99-99'
                      ? '—'
                      : new Date(nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num text-sm font-medium text-base-50">
                    {formatINR(sub.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={isCanceled ? 'coral' : 'mint'}>{isCanceled ? 'Canceled' : 'Active'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(sub.id)} title="Edit">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleStatus(sub.id)}
                        title={isCanceled ? 'Reactivate' : 'Cancel'}
                      >
                        {isCanceled ? <CheckCircle className="size-3.5" /> : <Ban className="size-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          if (confirm(`Delete "${sub.name}"? This cannot be undone.`)) deleteSubscription(sub.id);
                        }}
                        title="Delete"
                        className="hover:text-coral"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
