import type { AppData } from './types';
import { createEmptyAppData } from './seed-data';

const STORAGE_KEY = 'subtracker_data_v1';

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyAppData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.lists || !parsed.categories || !parsed.subscriptions) {
      return createEmptyAppData();
    }
    if (!parsed.settings) parsed.settings = { notificationsEnabled: false };
    return parsed;
  } catch (e) {
    console.error('Failed to load app data', e);
    return createEmptyAppData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save app data', e);
  }
}

export function exportAppDataAsFile(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `subscription-tracker-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importAppDataFromFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        if (!parsed.lists || !parsed.categories || !parsed.subscriptions) {
          reject(new Error('Invalid backup file format.'));
          return;
        }
        if (!parsed.settings) parsed.settings = { notificationsEnabled: false };
        resolve(parsed);
      } catch {
        reject(new Error('Could not parse file as JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}
