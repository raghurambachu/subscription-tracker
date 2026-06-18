import * as React from 'react';
import { useAppState } from '@/hooks/use-app-state';
import { exportAppDataAsFile, importAppDataFromFile } from '@/lib/storage';
import { CATEGORY_PALETTE } from '@/lib/seed-data';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { Trash2, Plus, Download, Upload, Bell, Pencil, Check, X } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    data,
    renameList,
    deleteList,
    addList,
    addCategory,
    renameCategory,
    deleteCategory,
    replaceAllData,
    setNotificationsEnabled,
  } = useAppState();
  const { show } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [editingListId, setEditingListId] = React.useState<string | null>(null);
  const [editingListName, setEditingListName] = React.useState('');
  const [newListName, setNewListName] = React.useState('');

  const [editingCatId, setEditingCatId] = React.useState<string | null>(null);
  const [editingCatName, setEditingCatName] = React.useState('');
  const [newCategoryName, setNewCategoryName] = React.useState('');

  const [notifPermission, setNotifPermission] = React.useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const handleExport = () => {
    exportAppDataAsFile(data);
    show('Backup downloaded');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importAppDataFromFile(file);
      if (confirm('This will replace all current data with the backup file. Continue?')) {
        replaceAllData(imported);
        show('Data restored from backup');
      }
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to import file', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleEnableNotifications = async () => {
    if (typeof Notification === 'undefined') {
      show('Notifications are not supported in this browser', 'error');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      show('Notifications enabled');
      new Notification('Subscriptions', { body: "You'll be reminded before upcoming charges." });
    } else {
      setNotificationsEnabled(false);
      show('Notification permission denied', 'error');
    }
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const color = CATEGORY_PALETTE[data.lists.length % CATEGORY_PALETTE.length];
    addList(newListName.trim(), color);
    setNewListName('');
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const color = CATEGORY_PALETTE[data.categories.length % CATEGORY_PALETTE.length];
    addCategory(newCategoryName.trim(), color);
    setNewCategoryName('');
  };

  const subCountForList = (id: string) => data.subscriptions.filter((s) => s.listId === id).length;
  const subCountForCategory = (id: string) => data.subscriptions.filter((s) => s.categoryId === id).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lists, categories & data</DialogTitle>
          <DialogDescription>Manage how your subscriptions are organized, and back up your data.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lists">
          <TabsList>
            <TabsTrigger value="lists">Lists</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="data">Backup</TabsTrigger>
            <TabsTrigger value="notifications">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="lists">
            <div className="flex flex-col gap-2">
              {data.lists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-base-700 bg-base-900 px-3 py-2.5"
                >
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                  {editingListId === list.id ? (
                    <>
                      <Input
                        value={editingListName}
                        onChange={(e) => setEditingListName(e.target.value)}
                        className="h-8 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameList(list.id, editingListName.trim() || list.name);
                            setEditingListId(null);
                          }
                          if (e.key === 'Escape') setEditingListId(null);
                        }}
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          renameList(list.id, editingListName.trim() || list.name);
                          setEditingListId(null);
                        }}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditingListId(null)}>
                        <X className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-base-100">{list.name}</span>
                      <span className="text-[11px] text-base-400">{subCountForList(list.id)} subs</span>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingListId(list.id);
                          setEditingListName(list.name);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {!list.isDefault && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="hover:text-coral"
                          onClick={() => {
                            if (confirm(`Delete list "${list.name}"? Subscriptions in it will move to your first list.`)) {
                              deleteList(list.id);
                              show(`List "${list.name}" deleted`, 'info');
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}

              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="New list name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                />
                <Button variant="secondary" onClick={handleCreateList} disabled={!newListName.trim()}>
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
              {data.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-base-700 bg-base-900 px-3 py-2.5"
                >
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  {editingCatId === cat.id ? (
                    <>
                      <Input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="h-8 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameCategory(cat.id, editingCatName.trim() || cat.name);
                            setEditingCatId(null);
                          }
                          if (e.key === 'Escape') setEditingCatId(null);
                        }}
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          renameCategory(cat.id, editingCatName.trim() || cat.name);
                          setEditingCatId(null);
                        }}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditingCatId(null)}>
                        <X className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-base-100">{cat.name}</span>
                      <span className="text-[11px] text-base-400">{subCountForCategory(cat.id)} subs</span>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditingCatName(cat.name);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="hover:text-coral"
                        onClick={() => {
                          if (confirm(`Delete category "${cat.name}"? Subscriptions in it will move to "Other".`)) {
                            deleteCategory(cat.id);
                            show(`Category "${cat.name}" deleted`, 'info');
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <Input
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <Button variant="secondary" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="data">
            <div className="flex flex-col gap-4">
              <div className="rounded-[var(--radius-md)] border border-base-700 bg-base-900 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-base-100">Export backup</div>
                    <div className="text-[12px] text-base-400">Download all your data as a JSON file.</div>
                  </div>
                  <Button variant="secondary" onClick={handleExport}>
                    <Download className="size-4" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-base-700 bg-base-900 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-base-100">Import backup</div>
                    <div className="text-[12px] text-base-400">Restore from a previously exported JSON file.</div>
                  </div>
                  <Button variant="secondary" onClick={handleImportClick}>
                    <Upload className="size-4" />
                    Import
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <p className="text-[12px] text-base-400">
                Your data auto-saves to this browser as you go. Exporting gives you a portable backup you can restore
                later or move to another computer.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-base-700 bg-base-900 p-4">
                <div className="flex items-center gap-3">
                  <Bell className="size-4 text-base-300" />
                  <div>
                    <div className="text-sm font-medium text-base-100">Browser notifications</div>
                    <div className="text-[12px] text-base-400">
                      Get notified about upcoming charges and trial endings while this app is open.
                    </div>
                  </div>
                </div>
                {notifPermission === 'granted' ? (
                  <Switch
                    checked={data.settings.notificationsEnabled}
                    onCheckedChange={(v) => setNotificationsEnabled(v)}
                  />
                ) : (
                  <Button size="sm" variant="secondary" onClick={handleEnableNotifications}>
                    Enable
                  </Button>
                )}
              </div>
              {notifPermission === 'denied' && (
                <p className="text-[12px] text-coral">
                  Notifications are blocked for this site. Enable them from your browser's site settings to use this
                  feature.
                </p>
              )}
              <p className="text-[12px] text-base-400">
                Reminders use each subscription's "remind me" setting and trigger while the app tab is open.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
