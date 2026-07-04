'use client';

import { useState } from 'react';
import { Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import type { Table } from '@/types';

interface AdminTableCardProps {
  table: Table;
  onEdit: (table: Table) => void;
  onAssign: (table: Table) => void;
  onChanged: () => void;
}

export default function AdminTableCard({
  table,
  onEdit,
  onAssign,
  onChanged,
}: AdminTableCardProps) {
  const [deleting, setDeleting] = useState(false);
  const waiter = typeof table.assignedWaiter === 'string' ? null : table.assignedWaiter;

  const handleDelete = async () => {
    if (!confirm(`Delete Table ${table.tableNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/tables/${table._id}`);
      onChanged();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Table {table.tableNumber}</CardTitle>
        <StatusBadge status={table.status} />
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Seats {table.capacity}
        </div>

        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          {waiter ? (
            <>
              <p className="font-medium">{waiter.name}</p>
              <p className="text-xs text-muted-foreground">{waiter.email}</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No waiter assigned</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onAssign(table)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            {waiter ? 'Reassign' : 'Assign'}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onEdit(table)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={deleting || table.status === 'occupied'}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
