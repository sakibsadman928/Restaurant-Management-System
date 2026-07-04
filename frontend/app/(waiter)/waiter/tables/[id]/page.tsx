'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Users } from 'lucide-react';
import api from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/shared/StatusBadge';
import GroupCard from '@/components/waiter/GroupCard';
import type { Table, Group } from '@/types';

export default function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [table, setTable] = useState<Table | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [remainingSeats, setRemainingSeats] = useState(0);
  const [loading, setLoading] = useState(true);

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [guestCount, setGuestCount] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tableRes, groupsRes] = await Promise.all([
        api.get(`/tables/${id}`),
        api.get('/groups', { params: { table: id } }),
      ]);
      setTable(tableRes.data.data.table);
      setGroups(groupsRes.data.data.groups);
      setRemainingSeats(groupsRes.data.data.remainingSeats);
    } catch {
      setTable(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  usePolling(fetchData, 10000);

  const activeGroups = useMemo(() => groups.filter((g) => g.paymentStatus === 'unpaid'), [groups]);

  const handleAddGroup = async () => {
    const count = Number(guestCount);
    if (!count || count < 1) { setAddError('Enter a valid guest count'); return; }
    if (count > remainingSeats) {
      setAddError(`Only ${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining`);
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      await api.post('/groups', { tableId: id, guestCount: count });
      await fetchData();
      setAddGroupOpen(false);
      setGuestCount('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add group');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading table...
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Table not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/waiter/tables')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Table {table.tableNumber}</h1>
              <StatusBadge status={table.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Capacity {table.capacity}
                {table.status === 'occupied' && (
                  <span className={remainingSeats === 0 ? 'text-rose-600 font-medium' : 'text-amber-600 font-medium'}>
                    · {remainingSeats === 0 ? 'Full' : `${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining`}
                  </span>
                )}
              </span>
            </p>
          </div>
        </div>

        {remainingSeats > 0 && (
          <Button onClick={() => { setAddGroupOpen(true); setGuestCount(''); setAddError(''); }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Group
          </Button>
        )}
      </div>

      {activeGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No groups seated yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap &quot;Add Group&quot; to seat customers
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeGroups.map((group) => (
            <GroupCard
              key={group._id}
              group={group}
              onClick={() => router.push(`/waiter/tables/${id}/groups/${group._id}`)}
            />
          ))}
        </div>
      )}

      <Dialog open={addGroupOpen} onOpenChange={(o) => !o && setAddGroupOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Seat New Group — Table {table.tableNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Capacity: <span className="font-semibold text-foreground">{table.capacity}</span>
                <span className="mx-2">·</span>
                Remaining: <span className="font-semibold text-foreground">{remainingSeats}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestCount">Number of Guests</Label>
              <Input
                id="guestCount"
                type="number"
                min="1"
                max={remainingSeats}
                value={guestCount}
                onChange={(e) => { setGuestCount(e.target.value); setAddError(''); }}
                placeholder={`1 – ${remainingSeats}`}
                autoFocus
              />
            </div>

            {addError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {addError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGroupOpen(false)}>Cancel</Button>
            <Button disabled={adding || !guestCount} onClick={handleAddGroup}>
              {adding ? 'Seating...' : 'Start Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
