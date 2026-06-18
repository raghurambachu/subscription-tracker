# Subscription Tracker

A polished, offline-first subscription tracker built with React, TypeScript, Tailwind CSS, and shadcn-style components.

## Features

- **Calendar view** — month grid with colored "coin" dots for each billing day, highlighted markers for annual/trial/one-time charges, and a pulsing indicator on today. Click any empty day to add a subscription pre-dated to that day, or click a day with existing charges to see them and add another.
- **Light & dark mode** — toggle in the sidebar, persisted across sessions, defaults to your system preference on first visit.
- **List view** — sortable table of all subscriptions with status filters.
- **Stats & Insights** — projected yearly budget, average monthly cost, peak spending month, category breakdown (donut chart), 12-month spending forecast (bar chart), and per-list comparison.
- **Lists** — separate Personal/Work/custom lists with independent budgets.
- **Categories** — fully custom, color-coded.
- **Highlights** — flag subscriptions as annual, trial, or one-time.
- **Reminders** — browser notifications before upcoming charges or trial endings.
- **Data** — auto-saves to localStorage; export/import as JSON for backup or migration.
- **Currency** — INR only (₹), with Indian numbering format.

## Development

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build -> dist/ (serve with any static host, e.g. `npx serve dist`)
```

Optional: `npm run build:portable` produces a single self-contained `dist-portable/index.html`
with all JS/CSS/fonts inlined, openable directly via double-click with no server. Not the
primary distribution format for this project, but available if you want it.

## Tech stack

React 19, TypeScript, Tailwind CSS v4, Radix UI primitives (styled to match shadcn/ui),
Recharts for charts, lucide-react for icons. No backend — everything runs client-side.

## Theming

Colors are defined as CSS custom properties in `src/index.css`: a `:root` block for dark
(the default) and a `.light` block that overrides the same variable names for light mode.
Tailwind utility classes like `bg-base-900` compile to `background-color: var(--color-base-900)`,
so toggling the `.light` class on `<html>` (handled by `src/hooks/use-theme.tsx`) repaints the
entire app without touching any component. Chart colors in `stats-view.tsx` use the same CSS
variables directly (e.g. `var(--color-violet)`) so Recharts stays in sync automatically.

## Project structure

```
src/
  lib/            domain types, date/billing math, storage (localStorage + JSON export/import)
  hooks/          app state, theme (light/dark), reminder notifications
  components/
    ui/           shadcn-style primitives (button, dialog, select, etc.)
    layout/       sidebar, top bar, theme toggle, settings dialog
    calendar/     calendar grid, upcoming rail
    subscriptions/  list view, add/edit dialog, add-list dialog
    stats/        stats & insights view
```
