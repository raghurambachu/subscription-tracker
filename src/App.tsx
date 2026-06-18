import * as React from 'react';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import { ThemeProvider } from '@/hooks/use-theme';
import { useReminderNotifications } from '@/hooks/use-reminder-notifications';
import { ToastProvider } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar, type ViewMode } from '@/components/layout/topbar';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { UpcomingRail } from '@/components/calendar/upcoming-rail';
import { ListView } from '@/components/subscriptions/list-view';
import { StatsView } from '@/components/stats/stats-view';
import { SubscriptionDialog } from '@/components/subscriptions/subscription-dialog';
import { SettingsDialog } from '@/components/layout/settings-dialog';

function AppShell() {
  useReminderNotifications();

  const [view, setView] = React.useState<ViewMode>('calendar');
  const [monthDate, setMonthDate] = React.useState(new Date());
  const [subDialogOpen, setSubDialogOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [defaultDate, setDefaultDate] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const openAddDialog = () => {
    setEditId(null);
    setDefaultDate(null);
    setSubDialogOpen(true);
  };

  const openAddDialogForDate = (dateISO: string) => {
    setEditId(null);
    setDefaultDate(dateISO);
    setSubDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    setEditId(id);
    setDefaultDate(null);
    setSubDialogOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-base-900">
      <Sidebar
        onOpenSettings={() => setSettingsOpen(true)}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          view={view}
          onViewChange={setView}
          monthDate={monthDate}
          onMonthChange={setMonthDate}
          onAddSubscription={openAddDialog}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {view === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 lg:gap-6">
              <CalendarGrid
                monthDate={monthDate}
                onSelectSubscription={openEditDialog}
                onSelectDate={openAddDialogForDate}
              />
              <UpcomingRail onSelectSubscription={openEditDialog} />
            </div>
          )}
          {view === 'list' && <ListView onEdit={openEditDialog} onAddNew={openAddDialog} />}
          {view === 'stats' && <StatsView />}
        </main>
      </div>

      <SubscriptionDialog
        open={subDialogOpen}
        onOpenChange={setSubDialogOpen}
        editId={editId}
        defaultDate={defaultDate}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <ToastProvider>
          <TooltipProvider delayDuration={300}>
            <AppShell />
          </TooltipProvider>
        </ToastProvider>
      </AppStateProvider>
    </ThemeProvider>
  );
}

export default App;
