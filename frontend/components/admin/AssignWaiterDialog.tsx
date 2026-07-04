'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Table, User } from '@/types';

interface AssignWaiterDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  table: Table | null;
}

export default function AssignWaiterDialog({
  open,
  onClose,
  onSaved,
  table,
}: AssignWaiterDialogProps) {
  const [waiters, setWaiters] = useState<User[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setLoading(true);
    api
      .get('/admin/staff')
      .then(({ data }) => {
        const activeWaiters = data.data.staff.filter(
          (s: User) => s.role === 'waiter' && s.isActive
        );
        setWaiters(activeWaiters);

        const current = table?.assignedWaiter;
        setSelected(typeof current === 'string' ? current : current?._id ?? '');
      })
      .finally(() => setLoading(false));
  }, [open, table]);

  const handleAssign = async () => {
    if (!table || !selected) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/tables/${table._id}/assign`, { waiterId: selected });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign waiter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Waiter — Table {table?.tableNumber}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Loading waiters...
          </p>
        ) : waiters.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No active waiters available. Create a waiter account first.
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {waiters.map((w) => (
              <button
                key={w._id}
                type="button"
                onClick={() => setSelected(w._id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors',
                  selected === w._id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:bg-accent'
                )}
              >
                <span>{w.name}</span>
                <span className="text-xs text-muted-foreground">{w.email}</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selected || saving} onClick={handleAssign}>
            {saving ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
