'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import type { Table } from '@/types';

interface TableCardProps {
  table: Table;
}

export default function TableCard({ table }: TableCardProps) {
  const remaining = table.remainingSeats ?? table.capacity;
  const isFull = remaining === 0 && table.status === 'occupied';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Table {table.tableNumber}</CardTitle>
        <StatusBadge status={table.status} />
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Capacity: {table.capacity}
          </div>

          {table.status === 'occupied' && (
            <p className={`text-xs font-medium ${isFull ? 'text-rose-600' : 'text-amber-600'}`}>
              {isFull ? 'Full' : `${remaining} seat${remaining !== 1 ? 's' : ''} remaining`}
            </p>
          )}

          {table.status === 'available' && (
            <p className="text-xs text-emerald-600 font-medium">
              All {table.capacity} seats available
            </p>
          )}
        </div>

        <Link href={`/waiter/tables/${table._id}`} className="block">
          <Button size="sm" variant="outline" className="w-full">
            View Table
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
