'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTime, cn } from '@/lib/utils';
import type { Order, Table, Group } from '@/types';

interface KitchenOrderCardProps {
  order: Order;
  onMarkReady: (orderId: string) => void;
  updating: boolean;
}

export default function KitchenOrderCard({ order, onMarkReady, updating }: KitchenOrderCardProps) {
  const table = order.table as Table;
  const group = order.group as Group;
  const isReady = order.status === 'ready';

  return (
    <Card className={cn(isReady && 'border-emerald-300')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Table {table?.tableNumber ?? '—'}</CardTitle>
          {group?.groupLabel && (
            <span className="inline-block mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {group.groupLabel}
            </span>
          )}
        </div>
        <StatusBadge status={order.status} />
      </CardHeader>

      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {order.items.map((item, idx) => (
            <li key={item._id ?? idx} className="text-sm">
              <span className="font-medium">{item.quantity}× {item.name}</span>
              {item.specialInstructions && (
                <p className="text-xs text-amber-600">Note: {item.specialInstructions}</p>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(order.createdAt)}
        </div>

        {isReady ? (
          <p className="text-center text-xs font-medium text-emerald-600">
            Ready — awaiting waiter
          </p>
        ) : (
          <Button size="sm" className="w-full" disabled={updating} onClick={() => onMarkReady(order._id)}>
            {updating ? 'Updating...' : 'Mark Ready'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
