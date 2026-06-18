import * as React from 'react';
import { useAppState } from '@/hooks/use-app-state';
import { CATEGORY_PALETTE } from '@/lib/seed-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

interface AddListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddListDialog({ open, onOpenChange }: AddListDialogProps) {
  const { addList, setSelectedListId } = useAppState();
  const { show } = useToast();
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(CATEGORY_PALETTE[0]);

  React.useEffect(() => {
    if (open) {
      setName('');
      setColor(CATEGORY_PALETTE[Math.floor(Math.random() * CATEGORY_PALETTE.length)]);
    }
  }, [open]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = addList(name.trim(), color);
    setSelectedListId(id);
    show(`List "${name.trim()}" created`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New list</DialogTitle>
          <DialogDescription>Group subscriptions separately, e.g. by household member or project.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="list-name">List name</Label>
            <Input
              id="list-name"
              placeholder="e.g. Side Project, Family"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-7 rounded-full transition-transform hover:scale-110',
                    color === c && 'ring-2 ring-offset-2 ring-offset-base-850 ring-base-50'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
