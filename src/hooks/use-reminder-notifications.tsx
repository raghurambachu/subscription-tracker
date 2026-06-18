import * as React from 'react';
import { useAppState } from './use-app-state';
import { getNextBillingDate, toISODate, daysUntil } from '@/lib/date-utils';

const NOTIFIED_KEY = 'subtracker_notified_v1';

function getNotifiedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveNotifiedSet(set: Set<string>) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

/**
 * Checks all active subscriptions for upcoming reminders and fires a browser
 * Notification once per subscription+billing-date combo (de-duped via localStorage).
 */
export function useReminderNotifications() {
  const { data } = useAppState();

  React.useEffect(() => {
    if (!data.settings.notificationsEnabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const checkReminders = () => {
      const notified = getNotifiedSet();
      let changed = false;

      data.subscriptions
        .filter((s) => s.status === 'active')
        .forEach((sub) => {
          const isRecurring = sub.billingCycle === 'monthly' || sub.billingCycle === 'yearly' || sub.billingCycle === 'custom';
          const next = getNextBillingDate(sub, new Date(), { excludeToday: isRecurring });
          if (!next) return;
          const nextISO = toISODate(next);
          const reminderDays = sub.reminderDaysBefore ?? 0;
          const daysAway = daysUntil(nextISO);
          const notifyKey = `${sub.id}:${nextISO}`;

          if (daysAway <= reminderDays && daysAway >= 0 && !notified.has(notifyKey)) {
            const label =
              sub.billingCycle === 'trial'
                ? `Trial for "${sub.name}" ends ${daysAway === 0 ? 'today' : `in ${daysAway} day${daysAway === 1 ? '' : 's'}`}`
                : `"${sub.name}" bills ${daysAway === 0 ? 'today' : `in ${daysAway} day${daysAway === 1 ? '' : 's'}`}`;
            try {
              new Notification('Subscription reminder', { body: label });
            } catch {
              /* ignore notification errors */
            }
            notified.add(notifyKey);
            changed = true;
          }
        });

      if (changed) saveNotifiedSet(notified);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 1000 * 60 * 60); // hourly while open
    return () => clearInterval(interval);
  }, [data.subscriptions, data.settings.notificationsEnabled]);
}
