'use client';

import { Clock, BellRing } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatPrice, formatTime } from '@/lib/utils';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onSend: (orderId: string) => void;
  onAcknowledge: (orderId: string, notificationId: string) => void;
  onServe: (orderId: string) => void;
  unreadNotificationId: string | null;
  busy: boolean;
}

export default function OrderCard({
  order,
  onEdit,
  onSend,
  onAcknowledge,
  onServe,
  unreadNotificationId,
  busy,
}: OrderCardProps) {
  const notedItems = order.items.filter((i) => i.specialInstructions);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">
          Order #{order._id.slice(-6).toUpperCase()}
        </CardTitle>
        <StatusBadge status={order.status} />
      </CardHeader>

      <CardContent className="space-y-3">
        <ul className="space-y-1">
          {order.items.map((item, idx) => (
            <li key={item._id ?? idx} className="flex justify-between text-sm">
              <span>{item.quantity}× {item.name}</span>
              <span className="text-muted-foreground">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {notedItems.length > 0 && (
          <div className="space-y-0.5 rounded-md bg-amber-50 p-2">
            {notedItems.map((i, idx) => (
              <p key={idx} className="text-xs text-amber-700">
                {i.name}: {i.specialInstructions}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(order.createdAt)}
          </div>
          <span className="text-sm font-semibold">{formatPrice(order.totalAmount)}</span>
        </div>

        {order.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(order)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={busy}
              onClick={() => onSend(order._id)}
            >
              {busy ? 'Sending...' : 'Send to Kitchen'}
            </Button>
          </div>
        )}

        {order.status === 'ready' && unreadNotificationId && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2">
              <BellRing className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs text-emerald-700 font-medium">
                Food is ready — pick it up from kitchen
              </p>
            </div>
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={busy}
              onClick={() => onAcknowledge(order._id, unreadNotificationId)}
            >
              {busy ? 'Confirming...' : 'Confirm Pickup'}
            </Button>
          </div>
        )}

        {order.status === 'ready' && !unreadNotificationId && (
          <Button
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() => onServe(order._id)}
          >
            {busy ? 'Updating...' : 'Mark Served'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
