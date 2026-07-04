'use client';

import { useState, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import api from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import type { Notification, Table, Order } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data.notifications);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchNotifications, 8000);

  const handleMarkRead = async (id: string) => {
    setReadingId(id);
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } finally {
      setReadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Orders ready to be served</p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Bell className="h-8 w-8" />
          <p className="text-sm">You&apos;re all caught up</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const table = n.table as Table;
            const order = n.order as Order;

            return (
              <Card key={n._id} className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-semibold">
                      Table {table?.tableNumber ?? '—'} — Order Ready
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order?.items?.length ?? 0} item(s) · {formatTime(n.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={readingId === n._id}
                    onClick={() => handleMarkRead(n._id)}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    {readingId === n._id ? 'Marking...' : 'Got it'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
