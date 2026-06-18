import * as React from 'react';
import type { AppData, Subscription, SubList, Category } from '@/lib/types';
import { loadAppData, saveAppData } from '@/lib/storage';
import { uid, todayISO, formatCurrency } from '@/lib/date-utils';

interface AppStateContextValue {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleStatus: (id: string) => void;
  addList: (name: string, color: string) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  addCategory: (name: string, color: string) => string;
  renameCategory: (id: string, name: string, color?: string) => void;
  deleteCategory: (id: string) => void;
  setSelectedListId: (id: string | 'all') => void;
  replaceAllData: (newData: AppData) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setCurrency: (code: string) => void;
  formatMoney: (amount: number) => string;
}

const AppStateContext = React.createContext<AppStateContextValue | null>(null);

export function useAppState() {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<AppData>(() => loadAppData());

  // Auto-save on every change
  React.useEffect(() => {
    saveAppData(data);
  }, [data]);

  const addSubscription: AppStateContextValue['addSubscription'] = (sub) => {
    const now = new Date().toISOString();
    const newSub: Subscription = { ...sub, id: uid(), createdAt: now, updatedAt: now };
    setData((prev) => ({ ...prev, subscriptions: [...prev.subscriptions, newSub] }));
  };

  const updateSubscription: AppStateContextValue['updateSubscription'] = (id, patch) => {
    setData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
      ),
    }));
  };

  const deleteSubscription: AppStateContextValue['deleteSubscription'] = (id) => {
    setData((prev) => ({ ...prev, subscriptions: prev.subscriptions.filter((s) => s.id !== id) }));
  };

  const toggleStatus: AppStateContextValue['toggleStatus'] = (id) => {
    setData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'active' ? 'canceled' : 'active', updatedAt: new Date().toISOString() }
          : s
      ),
    }));
  };

  const addList: AppStateContextValue['addList'] = (name, color) => {
    const id = uid();
    const newList: SubList = { id, name, color };
    setData((prev) => ({ ...prev, lists: [...prev.lists, newList] }));
    return id;
  };

  const renameList: AppStateContextValue['renameList'] = (id, name) => {
    setData((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => (l.id === id ? { ...l, name } : l)),
    }));
  };

  const deleteList: AppStateContextValue['deleteList'] = (id) => {
    setData((prev) => {
      const remainingLists = prev.lists.filter((l) => l.id !== id);
      const fallbackListId = remainingLists[0]?.id ?? 'personal';
      return {
        ...prev,
        lists: remainingLists,
        subscriptions: prev.subscriptions.map((s) =>
          s.listId === id ? { ...s, listId: fallbackListId } : s
        ),
        selectedListId: prev.selectedListId === id ? 'all' : prev.selectedListId,
      };
    });
  };

  const addCategory: AppStateContextValue['addCategory'] = (name, color) => {
    const id = uid();
    const newCat: Category = { id, name, color };
    setData((prev) => ({ ...prev, categories: [...prev.categories, newCat] }));
    return id;
  };

  const renameCategory: AppStateContextValue['renameCategory'] = (id, name, color) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, name, color: color ?? c.color } : c)),
    }));
  };

  const deleteCategory: AppStateContextValue['deleteCategory'] = (id) => {
    setData((prev) => {
      const remaining = prev.categories.filter((c) => c.id !== id);
      const fallback = remaining[0]?.id ?? 'other';
      return {
        ...prev,
        categories: remaining,
        subscriptions: prev.subscriptions.map((s) =>
          s.categoryId === id ? { ...s, categoryId: fallback } : s
        ),
      };
    });
  };

  const setSelectedListId: AppStateContextValue['setSelectedListId'] = (id) => {
    setData((prev) => ({ ...prev, selectedListId: id }));
  };

  const replaceAllData: AppStateContextValue['replaceAllData'] = (newData) => {
    setData(newData);
  };

  const setNotificationsEnabled: AppStateContextValue['setNotificationsEnabled'] = (enabled) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, notificationsEnabled: enabled } }));
  };

  const setCurrency: AppStateContextValue['setCurrency'] = (code) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, currency: code } }));
  };

  const currency = data.settings.currency ?? 'INR';
  const formatMoney = React.useCallback(
    (amount: number) => formatCurrency(amount, currency),
    [currency]
  );

  const value: AppStateContextValue = {
    data,
    setData,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleStatus,
    addList,
    renameList,
    deleteList,
    addCategory,
    renameCategory,
    deleteCategory,
    setSelectedListId,
    replaceAllData,
    setNotificationsEnabled,
    setCurrency,
    formatMoney,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function getTodayMarker() {
  return todayISO();
}
