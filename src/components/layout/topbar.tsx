import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus, Menu } from 'lucide-react';
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
  onOpenSidebar: () => void;
}

export function TopBar({
  view,
  onViewChange,
  monthDate,
  onMonthChange,
  onAddSubscription,
  onOpenSidebar,
}: TopBarProps) {
  const goPrev = () => onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
  const goNext = () => onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));
  const goToday = () => onMonthChange(new Date());

  const isCurrentMonth =
    monthDate.getFullYear() === new Date().getFullYear() && monthDate.getMonth() === new Date().getMonth();

  return (
    <header className="flex flex-col gap-3 border-b border-base-700 bg-base-900 px-3 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <div className="flex items-center justify-between gap-2 lg:justify-start">
        <div className="flex min-w-0 items-center gap-1 lg:gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1.5 shrink-0 lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>

          {view !== 'stats' && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={goPrev} aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="font-display min-w-0 truncate text-center text-[14px] font-semibold sm:min-w-[150px] sm:text-[15px]">
                {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={goNext} aria-label="Next month">
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
            <span className="font-display truncate text-[15px] font-semibold">Statistics & Insights</span>
          )}
        </div>

        <Button onClick={onAddSubscription} variant="gradient" className="shrink-0 gap-1.5 lg:hidden">
          <Plus className="size-4" />
          <span className="sr-only sm:not-sr-only">Add subscription</span>
        </Button>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Tabs value={view} onValueChange={(v) => onViewChange(v as ViewMode)} className="hidden lg:block">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={onAddSubscription} variant="gradient" className="hidden gap-1.5 lg:inline-flex">
          <Plus className="size-4" />
          Add subscription
        </Button>
      </div>

      <Tabs
        value={view}
        onValueChange={(v) => onViewChange(v as ViewMode)}
        className="w-full lg:hidden"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
      </Tabs>
    </header>
  );
}
