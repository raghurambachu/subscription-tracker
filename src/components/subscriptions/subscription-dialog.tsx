import * as React from 'react';
import { useAppState } from '@/hooks/use-app-state';
import { CATEGORY_PALETTE } from '@/lib/seed-data';
import { todayISO, CURRENCIES } from '@/lib/date-utils';
import type { BillingCycle, HighlightFlag, Subscription } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Star, Sparkles, PackageCheck, Plus, Trash2 } from 'lucide-react';

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId: string | null;
  defaultDate?: string | null;
}

const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom interval' },
  { value: 'one-time', label: 'One-time purchase' },
  { value: 'trial', label: 'Trial' },
];

const HIGHLIGHT_OPTIONS: { value: HighlightFlag; label: string; icon: React.ReactNode }[] = [
  { value: 'none', label: 'None', icon: null },
  { value: 'annual', label: 'Annual', icon: <Star className="size-3.5" /> },
  { value: 'trial', label: 'Trial', icon: <Sparkles className="size-3.5" /> },
  { value: 'one-time', label: 'One-time', icon: <PackageCheck className="size-3.5" /> },
];

function emptyForm() {
  return {
    name: '',
    listId: '',
    categoryId: '',
    amount: '',
    billingCycle: 'monthly' as BillingCycle,
    customIntervalDays: '30',
    startDate: todayISO(),
    status: 'active' as Subscription['status'],
    highlight: 'none' as HighlightFlag,
    notes: '',
    reminderDaysBefore: '2',
    trialEndDate: '',
  };
}

export function SubscriptionDialog({ open, onOpenChange, editId, defaultDate }: SubscriptionDialogProps) {
  const { data, addSubscription, updateSubscription, deleteSubscription, addCategory } = useAppState();
  const { show } = useToast();
  const currencySymbol = CURRENCIES[data.settings.currency]?.symbol ?? '₹';

  const [form, setForm] = React.useState(emptyForm());
  const [newCategoryMode, setNewCategoryMode] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');

  const editingSub = editId ? data.subscriptions.find((s) => s.id === editId) : null;

  React.useEffect(() => {
    if (!open) return;
    setNewCategoryMode(false);
    setNewCategoryName('');
    if (editingSub) {
      setForm({
        name: editingSub.name,
        listId: editingSub.listId,
        categoryId: editingSub.categoryId,
        amount: String(editingSub.amount),
        billingCycle: editingSub.billingCycle,
        customIntervalDays: String(editingSub.customIntervalDays ?? 30),
        startDate: editingSub.startDate,
        status: editingSub.status,
        highlight: editingSub.highlight,
        notes: editingSub.notes ?? '',
        reminderDaysBefore: String(editingSub.reminderDaysBefore ?? 2),
        trialEndDate: editingSub.trialEndDate ?? '',
      });
    } else {
      const defaultListId = data.selectedListId !== 'all' ? data.selectedListId : data.lists[0]?.id ?? '';
      setForm({
        ...emptyForm(),
        listId: defaultListId,
        categoryId: data.categories[0]?.id ?? '',
        startDate: defaultDate ?? todayISO(),
      });
    }
  }, [open, editId, defaultDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const isValid =
    form.name.trim().length > 0 &&
    form.listId &&
    form.categoryId &&
    form.amount.trim().length > 0 &&
    !isNaN(Number(form.amount)) &&
    Number(form.amount) >= 0 &&
    (form.billingCycle !== 'trial' || true);

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const color = CATEGORY_PALETTE[data.categories.length % CATEGORY_PALETTE.length];
    const id = addCategory(newCategoryName.trim(), color);
    setForm((f) => ({ ...f, categoryId: id }));
    setNewCategoryMode(false);
    setNewCategoryName('');
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const payload = {
      name: form.name.trim(),
      listId: form.listId,
      categoryId: form.categoryId,
      amount: Number(form.amount),
      billingCycle: form.billingCycle,
      customIntervalDays: form.billingCycle === 'custom' ? Number(form.customIntervalDays) || 30 : undefined,
      startDate: form.startDate,
      status: form.status,
      highlight:
        form.highlight === 'none' && form.billingCycle === 'trial'
          ? ('trial' as HighlightFlag)
          : form.highlight === 'none' && form.billingCycle === 'yearly'
          ? ('annual' as HighlightFlag)
          : form.highlight === 'none' && form.billingCycle === 'one-time'
          ? ('one-time' as HighlightFlag)
          : form.highlight,
      notes: form.notes.trim() || undefined,
      reminderDaysBefore: form.reminderDaysBefore ? Number(form.reminderDaysBefore) : undefined,
      trialEndDate: form.billingCycle === 'trial' ? form.trialEndDate || undefined : undefined,
    };

    if (editingSub) {
      updateSubscription(editingSub.id, payload);
      show(`"${payload.name}" updated`);
    } else {
      addSubscription(payload);
      show(`"${payload.name}" added`);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!editingSub) return;
    if (confirm(`Delete "${editingSub.name}"? This cannot be undone.`)) {
      deleteSubscription(editingSub.id);
      show(`"${editingSub.name}" deleted`, 'info');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingSub ? 'Edit subscription' : 'Add subscription'}</DialogTitle>
          <DialogDescription>
            {editingSub ? 'Update the details below.' : 'Track a new recurring charge, trial, or purchase.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sub-name">Name</Label>
            <Input
              id="sub-name"
              placeholder="e.g. Netflix, Notion, AWS"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>List</Label>
              <Select value={form.listId} onValueChange={(v) => setForm((f) => ({ ...f, listId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a list" />
                </SelectTrigger>
                <SelectContent>
                  {data.lists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              {!newCategoryMode ? (
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => {
                    if (v === '__new__') {
                      setNewCategoryMode(true);
                    } else {
                      setForm((f) => ({ ...f, categoryId: v }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-1.5 text-violet">
                        <Plus className="size-3.5" /> New category
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    autoFocus
                  />
                  <Button size="icon" variant="secondary" onClick={handleCreateCategory}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-amount">Amount ({currencySymbol})</Label>
              <Input
                id="sub-amount"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Billing cycle</Label>
              <Select
                value={form.billingCycle}
                onValueChange={(v) => setForm((f) => ({ ...f, billingCycle: v as BillingCycle }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CYCLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.billingCycle === 'custom' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-interval">Repeat every (days)</Label>
              <Input
                id="sub-interval"
                type="number"
                min="1"
                value={form.customIntervalDays}
                onChange={(e) => setForm((f) => ({ ...f, customIntervalDays: e.target.value }))}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-start">
                {form.billingCycle === 'one-time'
                  ? 'Purchase date'
                  : form.billingCycle === 'trial'
                  ? 'Trial start date'
                  : 'Next billing date'}
              </Label>
              <Input
                id="sub-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              {form.billingCycle !== 'one-time' && form.billingCycle !== 'trial' && (
                <p className="text-[11px] text-base-400">
                  Enter the next date this charges you — past or upcoming. Future renewals are calculated from it.
                </p>
              )}
            </div>

            {form.billingCycle === 'trial' ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sub-trial-end">Trial ends</Label>
                <Input
                  id="sub-trial-end"
                  type="date"
                  value={form.trialEndDate}
                  onChange={(e) => setForm((f) => ({ ...f, trialEndDate: e.target.value }))}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sub-reminder">Remind me (days before)</Label>
                <Input
                  id="sub-reminder"
                  type="number"
                  min="0"
                  value={form.reminderDaysBefore}
                  onChange={(e) => setForm((f) => ({ ...f, reminderDaysBefore: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Highlight</Label>
            <div className="flex flex-wrap gap-2">
              {HIGHLIGHT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm((f) => ({ ...f, highlight: opt.value }))}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
                    form.highlight === opt.value
                      ? 'border-amber/40 bg-amber-soft text-amber'
                      : 'border-base-600 text-base-300 hover:bg-base-800'
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sub-notes">Notes (optional)</Label>
            <Textarea
              id="sub-notes"
              placeholder="Any extra details — plan tier, shared account, etc."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {editingSub && (
            <div className="flex items-center gap-2 border-t border-base-700 pt-4">
              <Label className="mr-auto">Status</Label>
              <button
                onClick={() => setForm((f) => ({ ...f, status: 'active' }))}
                className={cn(
                  'rounded-full px-3 py-1 text-[12px] font-medium transition-colors',
                  form.status === 'active' ? 'bg-mint text-base-950' : 'bg-base-800 text-base-300'
                )}
              >
                Active
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, status: 'canceled' }))}
                className={cn(
                  'rounded-full px-3 py-1 text-[12px] font-medium transition-colors',
                  form.status === 'canceled' ? 'bg-coral text-white' : 'bg-base-800 text-base-300'
                )}
              >
                Canceled
              </button>
            </div>
          )}
        </div>

        <DialogFooter className={cn('flex-wrap', editingSub && 'justify-between sm:justify-between')}>
          {editingSub ? (
            <Button variant="ghost" onClick={handleDelete} className="text-coral hover:bg-coral/10 hover:text-coral mr-auto">
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : null}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid}>
              {editingSub ? 'Save changes' : 'Add subscription'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
