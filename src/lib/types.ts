// ===== Core domain types =====

export type BillingCycle = 'monthly' | 'yearly' | 'one-time' | 'trial' | 'custom';

export type SubStatus = 'active' | 'canceled';

export type HighlightFlag = 'none' | 'annual' | 'trial' | 'one-time';

export interface Category {
  id: string;
  name: string;
  color: string; // hex
}

export interface SubList {
  id: string;
  name: string; // "Personal" | "Work" | custom
  color: string;
  isDefault?: boolean; // Personal/Work are defaults, can't be deleted
}

export interface Subscription {
  id: string;
  listId: string;
  name: string;
  categoryId: string;
  amount: number; // in the app's selected currency
  billingCycle: BillingCycle;
  customIntervalDays?: number; // for 'custom' cycle, e.g. every 45 days
  startDate: string; // ISO date string YYYY-MM-DD
  status: SubStatus;
  highlight: HighlightFlag;
  notes?: string;
  reminderDaysBefore?: number; // e.g. 2 -> remind 2 days before billing
  createdAt: string;
  updatedAt: string;
  // For trials: when does the trial end / convert
  trialEndDate?: string;
}

export interface AppData {
  version: number;
  lists: SubList[];
  categories: Category[];
  subscriptions: Subscription[];
  selectedListId: string | 'all';
  settings: {
    notificationsEnabled: boolean;
    currency: string; // ISO 4217 code, e.g. 'INR', 'USD'
  };
}

export interface BillingOccurrence {
  date: string; // ISO date YYYY-MM-DD
  subscription: Subscription;
}
