import type { Subscription, BillingOccurrence } from './types';

// ===== Date helpers (no external lib, keep core logic dependency-free) =====

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  const day = r.getDate();
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(day, lastDay));
  return r;
}

export function addYears(d: Date, n: number): Date {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + n);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const WEEKDAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ===== Billing occurrence calculation =====

/**
 * Returns all billing occurrences for a subscription that fall within [rangeStart, rangeEnd] (inclusive).
 * Handles monthly, yearly, custom-interval, and one-time/trial subs.
 */
export function getOccurrencesInRange(
  sub: Subscription,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const occurrences: Date[] = [];
  const start = parseISODate(sub.startDate);

  if (sub.billingCycle === 'one-time') {
    if (start >= rangeStart && start <= rangeEnd) occurrences.push(start);
    return occurrences;
  }

  if (sub.billingCycle === 'trial') {
    const keyDate = sub.trialEndDate ? parseISODate(sub.trialEndDate) : start;
    if (keyDate >= rangeStart && keyDate <= rangeEnd) occurrences.push(keyDate);
    return occurrences;
  }

  let stepFn: (d: Date, n: number) => Date;

  if (sub.billingCycle === 'monthly') {
    stepFn = addMonths;
  } else if (sub.billingCycle === 'yearly') {
    stepFn = addYears;
  } else {
    const intervalDays = sub.customIntervalDays && sub.customIntervalDays > 0 ? sub.customIntervalDays : 30;
    stepFn = (d, n) => addDays(d, n * intervalDays);
  }

  if (start > rangeEnd) return occurrences;

  let approxDaysPerStep = 30;
  if (sub.billingCycle === 'yearly') approxDaysPerStep = 365;
  if (sub.billingCycle === 'custom') {
    approxDaysPerStep = sub.customIntervalDays && sub.customIntervalDays > 0 ? sub.customIntervalDays : 30;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor((rangeStart.getTime() - start.getTime()) / msPerDay);
  let n = Math.max(0, Math.floor(daysSinceStart / approxDaysPerStep) - 2);

  let cursor = stepFn(start, n);
  while (cursor > rangeStart && n > 0) {
    n -= 1;
    cursor = stepFn(start, n);
  }
  while (cursor < rangeStart) {
    n += 1;
    cursor = stepFn(start, n);
  }

  const maxIterations = 5000;
  let iterations = 0;
  while (cursor <= rangeEnd && iterations < maxIterations) {
    if (cursor >= start) {
      occurrences.push(new Date(cursor));
    }
    n += 1;
    cursor = stepFn(start, n);
    iterations += 1;
  }

  return occurrences;
}

/**
 * Get all billing occurrences for a given month across the provided subs.
 */
export function getOccurrencesForMonth(
  subs: Subscription[],
  year: number,
  month: number // 0-indexed
): BillingOccurrence[] {
  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const result: BillingOccurrence[] = [];

  for (const sub of subs) {
    const dates = getOccurrencesInRange(sub, rangeStart, rangeEnd);
    for (const date of dates) {
      result.push({ date: toISODate(date), subscription: sub });
    }
  }

  return result;
}

/**
 * Get the next upcoming billing date for a subscription from a reference date.
 * Normalizes to start-of-day so a charge due "today" is correctly included by default.
 *
 * Pass `excludeToday: true` to get the *next* occurrence strictly after today — useful
 * for "next billing" displays once today's charge has already happened, so a fresh
 * yearly subscription started today shows next year's date instead of today's.
 */
export function getNextBillingDate(
  sub: Subscription,
  from: Date = new Date(),
  options?: { excludeToday?: boolean }
): Date | null {
  const todayStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const rangeStart = options?.excludeToday ? addDays(todayStart, 1) : todayStart;
  const rangeEnd = addYears(todayStart, 2);
  const dates = getOccurrencesInRange(sub, rangeStart, rangeEnd);
  return dates.length > 0 ? dates[0] : null;
}

/**
 * Annualized cost of a subscription — used for yearly budget projections.
 */
export function getAnnualizedCost(sub: Subscription): number {
  if (sub.status === 'canceled') return 0;
  switch (sub.billingCycle) {
    case 'monthly':
      return sub.amount * 12;
    case 'yearly':
      return sub.amount;
    case 'one-time':
      return 0;
    case 'trial':
      return 0;
    case 'custom': {
      const days = sub.customIntervalDays && sub.customIntervalDays > 0 ? sub.customIntervalDays : 30;
      return (sub.amount * 365) / days;
    }
    default:
      return 0;
  }
}

export function getMonthlyCost(sub: Subscription): number {
  return getAnnualizedCost(sub) / 12;
}

export interface CurrencyInfo {
  code: string; // ISO 4217
  symbol: string;
  label: string;
  locale: string;
  noDecimals?: boolean; // for JPY-like currencies
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', label: 'Indian Rupee', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', label: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', label: 'British Pound', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', label: 'Japanese Yen', locale: 'ja-JP', noDecimals: true },
  CAD: { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', locale: 'en-AU' },
  SGD: { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar', locale: 'en-SG' },
  AED: { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham', locale: 'ar-AE' },
  CNY: { code: 'CNY', symbol: '¥', label: 'Chinese Yuan', locale: 'zh-CN' },
  ZAR: { code: 'ZAR', symbol: 'R', label: 'South African Rand', locale: 'en-ZA' },
  BRL: { code: 'BRL', symbol: 'R$', label: 'Brazilian Real', locale: 'pt-BR' },
  MXN: { code: 'MXN', symbol: 'MX$', label: 'Mexican Peso', locale: 'es-MX' },
};

export function formatCurrency(amount: number, code: string = 'INR'): string {
  const currency = CURRENCIES[code] ?? CURRENCIES.INR;
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.001;
  const useGrouping = currency.noDecimals || isWhole;
  const opts: Intl.NumberFormatOptions = useGrouping
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `${currency.symbol}${rounded.toLocaleString(currency.locale, opts)}`;
}

export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const target = parseISODate(dateStr);
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}
