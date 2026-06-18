import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MONTH_NAMES } from '@/lib/date-utils';

export type ViewMode = 'calendar' | 'list' | 'stats';

interface TopBarProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  monthDate: Date;
  onMonthChange: (d: Date) => void;
  onAddSubscription: () => void;
}

export function TopBar({ view, onViewChange, monthDate, onMonthChange, onAddSubscription }: TopBarProps) {
  const goPrev = () => onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
  const goNext = () => onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));
  const goToday = () => onMonthChange(new Date());

  const isCurrentMonth =
    monthDate.getFullYear() === new Date().getFullYear() && monthDate.getMonth() === new Date().getMonth();

  return (
    <header className="flex items-center justify-between border-b border-base-700 bg-base-900 px-6 py-4">
      <div className="flex items-center gap-4">
        {view !== 'stats' && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={goPrev}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-display min-w-[150px] text-center text-[15px] font-semibold">
              {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={goNext}>
              <ChevronRight className="size-4" />
            </Button>
            {!isCurrentMonth && (
              <Button variant="outline" size="sm" className="ml-1" onClick={goToday}>
                Today
              </Button>
            )}
          </div>
        )}
        {view === 'stats' && (
          <span className="font-display text-[15px] font-semibold">Statistics & Insights</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Tabs value={view} onValueChange={(v) => onViewChange(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={onAddSubscription} variant="gradient" className="gap-1.5">
          <Plus className="size-4" />
          Add subscription
        </Button>
      </div>
    </header>
  );
}
