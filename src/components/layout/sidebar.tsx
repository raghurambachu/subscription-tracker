import * as React from 'react';
import { Layers, Plus, Wallet, Settings, CalendarDays } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { cn } from '@/lib/utils';
import { getAnnualizedCost } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { AddListDialog } from '@/components/subscriptions/add-list-dialog';
import { ThemeToggle } from '@/components/layout/theme-toggle';

interface SidebarProps {
  onOpenSettings: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ onOpenSettings, mobileOpen, onMobileClose }: SidebarProps) {
  const { data, setSelectedListId, formatMoney } = useAppState();
  const [addListOpen, setAddListOpen] = React.useState(false);

  const monthlyForList = (listId: string | 'all') => {
    const subs = data.subscriptions.filter(
      (s) => s.status === 'active' && (listId === 'all' || s.listId === listId)
    );
    const annual = subs.reduce((sum, s) => sum + getAnnualizedCost(s), 0);
    return annual / 12;
  };

  const activeCountForList = (listId: string | 'all') =>
    data.subscriptions.filter((s) => s.status === 'active' && (listId === 'all' || s.listId === listId)).length;

  const selectList = (id: string | 'all') => {
    setSelectedListId(id);
    onMobileClose?.();
  };

  return (
    <aside
      className={cn(
        'flex h-screen shrink-0 flex-col border-r border-base-700 bg-base-950',
        'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transition-transform duration-300 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 lg:transition-none'
      )}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-violet shadow-[0_4px_12px_-2px_rgba(108,92,231,0.5)]">
          <CalendarDays className="size-4.5 text-white" />
        </div>
        <span className="font-display text-[15px] font-semibold tracking-tight">Subscriptions</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none">
        <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-base-400">
          Lists
        </div>

        <button
          onClick={() => selectList('all')}
          className={cn(
            'group flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors',
            data.selectedListId === 'all'
              ? 'bg-base-800 text-base-50'
              : 'text-base-300 hover:bg-base-800/60 hover:text-base-100'
          )}
        >
          <span className="flex items-center gap-2.5">
            <Layers className="size-4 text-base-400" />
            All Lists
          </span>
          <span className="font-mono-num text-[11px] text-base-400">{activeCountForList('all')}</span>
        </button>

        <div className="mt-1 flex flex-col gap-0.5">
          {data.lists.map((list) => (
            <button
              key={list.id}
              onClick={() => selectList(list.id)}
              className={cn(
                'group flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors',
                data.selectedListId === list.id
                  ? 'bg-base-800 text-base-50'
                  : 'text-base-300 hover:bg-base-800/60 hover:text-base-100'
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: list.color }}
                />
                <span className="truncate">{list.name}</span>
              </span>
              <span className="font-mono-num text-[11px] text-base-400 shrink-0">
                {activeCountForList(list.id)}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setAddListOpen(true)}
          className="mt-1 flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-base-400 transition-colors hover:bg-base-800/60 hover:text-base-100"
        >
          <Plus className="size-4" />
          New list
        </button>

        <div className="mt-6 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-base-400">
          This month
        </div>
        <div className="mx-1 rounded-[var(--radius-lg)] border border-base-700 bg-base-900 p-3.5">
          <div className="flex items-center gap-2 text-base-300">
            <Wallet className="size-3.5 shrink-0" />
            <span className="truncate text-xs">
              {data.selectedListId === 'all' ? 'All lists' : data.lists.find((l) => l.id === data.selectedListId)?.name}
            </span>
          </div>
          <div className="mt-1.5 font-display text-2xl font-semibold text-base-50">
            {formatMoney(monthlyForList(data.selectedListId))}
          </div>
          <div className="text-[11px] text-base-400">avg. per month</div>
        </div>
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-base-700 px-3 py-2.5">
        <span className="text-[12px] font-medium text-base-400">Appearance</span>
        <ThemeToggle />
      </div>

      <div className="border-t border-base-700 p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-base-300"
          onClick={() => {
            onOpenSettings();
            onMobileClose?.();
          }}
        >
          <Settings className="size-4" />
          Lists, categories & data
        </Button>
      </div>

      <AddListDialog open={addListOpen} onOpenChange={setAddListOpen} />
    </aside>
  );
}
