'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import KitchenOrderCard from '@/components/chef/KitchenOrderCard';
import type { Order } from '@/types';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data.data.orders);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchOrders, 8000);

  const handleMarkReady = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'ready' });
      await fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading kitchen queue...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kitchen Queue</h1>
        <p className="text-sm text-muted-foreground">{orders.length} active orders</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active orders right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {orders.map((order) => (
            <KitchenOrderCard
              key={order._id}
              order={order}
              onMarkReady={handleMarkReady}
              updating={updatingId === order._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
