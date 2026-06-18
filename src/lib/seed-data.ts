import type { AppData, Category, SubList } from './types';

export const DEFAULT_LISTS: SubList[] = [
  { id: 'personal', name: 'Personal', color: '#6C5CE7', isDefault: true },
  { id: 'work', name: 'Work', color: '#00D9A3', isDefault: true },
];

// Curated 8-hue wheel for categories — distinct, saturated, readable on dark bg
export const CATEGORY_PALETTE = [
  '#6C5CE7', // violet
  '#00D9A3', // mint
  '#FF6B6B', // coral
  '#FFB84D', // amber
  '#4DA8FF', // sky blue
  '#FF6FB5', // pink
  '#A3E635', // lime
  '#FF9F4D', // orange
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'streaming', name: 'Streaming', color: '#FF6B6B' },
  { id: 'productivity', name: 'Productivity', color: '#6C5CE7' },
  { id: 'cloud', name: 'Cloud & Storage', color: '#4DA8FF' },
  { id: 'music', name: 'Music', color: '#FF6FB5' },
  { id: 'fitness', name: 'Fitness', color: '#A3E635' },
  { id: 'news', name: 'News & Reading', color: '#FFB84D' },
  { id: 'gaming', name: 'Gaming', color: '#FF9F4D' },
  { id: 'other', name: 'Other', color: '#00D9A3' },
];

export function createEmptyAppData(): AppData {
  return {
    version: 1,
    lists: DEFAULT_LISTS,
    categories: DEFAULT_CATEGORIES,
    subscriptions: [],
    selectedListId: 'all',
    settings: {
      notificationsEnabled: false,
      currency: 'INR',
    },
  };
}
