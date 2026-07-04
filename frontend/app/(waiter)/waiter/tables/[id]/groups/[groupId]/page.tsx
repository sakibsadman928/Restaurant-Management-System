'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Receipt, ArrowLeft, Users } from 'lucide-react';
import api from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/shared/StatusBadge';
import OrderCard from '@/components/waiter/OrderCard';
import MenuItemPicker, { type DraftItem } from '@/components/waiter/MenuItemPicker';
import BillDialog from '@/components/waiter/BillDialog';
import { formatPrice } from '@/lib/utils';
import type { Order, Group, Notification } from '@/types';

type TabValue = 'active' | 'completed';

export default function GroupDetailPage() {
  const { id: tableId, groupId } = useParams<{ id: string; groupId: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [tab, setTab] = useState<TabValue>('active');

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, ordersRes, notifRes] = await Promise.all([
        api.get('/groups', { params: { table: tableId } }),
        api.get('/orders', { params: { group: groupId } }),
        api.get('/notifications'),
      ]);

      const foundGroup = groupsRes.data.data.groups.find(
        (g: Group) => g._id === groupId
      );
      setGroup(foundGroup ?? null);
      setOrders(ordersRes.data.data.orders);
      setNotifications(notifRes.data.data.notifications);
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [tableId, groupId]);

  usePolling(fetchData, 8000);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.paymentStatus === 'unpaid'),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => o.paymentStatus === 'paid'),
    [orders]
  );

  const canViewBill = useMemo(
    () => activeOrders.length > 0 && activeOrders.every((o) => o.status === 'served'),
    [activeOrders]
  );

  const activeTotal = useMemo(
    () => activeOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    [activeOrders]
  );

  const unreadNotifMap = useMemo(() => {
    const map = new Map<string, string>();
    notifications.forEach((n) => {
      const orderId = typeof n.order === 'string' ? n.order : (n.order as Order)._id;
      map.set(orderId, n._id);
    });
    return map;
  }, [notifications]);

  const handleUpdateItems = async (items: DraftItem[]) => {
    if (!editingOrder) return;
    await api.put(`/orders/${editingOrder._id}/items`, {
      items: items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        specialInstructions: i.specialInstructions,
      })),
    });
    setEditingOrder(null);
    await fetchData();
  };

  const handleSend = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      await api.put(`/orders/${orderId}/send`);
      await fetchData();
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleAcknowledge = async (orderId: string, notificationId: string) => {
    setBusyOrderId(orderId);
    try {
      await api.put(`/notifications/${notificationId}/read`);
      await fetchData();
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleServe = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      await api.put(`/orders/${orderId}/serve`);
      await fetchData();
    } finally {
      setBusyOrderId(null);
    }
  };

  const handlePaid = () => {
    router.push(`/waiter/tables/${tableId}`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading group...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Group not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/waiter/tables/${tableId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{group.groupLabel}</h1>
              <StatusBadge status={group.paymentStatus} />
            </div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {group.guestCount} guest{group.guestCount !== 1 ? 's' : ''}
              {activeOrders.length > 0 && (
                <span className="ml-1 font-medium text-foreground">
                  · Running total: {formatPrice(activeTotal)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!canViewBill}
            onClick={() => setBillOpen(true)}
            title={!canViewBill ? 'All orders must be served before viewing the bill' : ''}
          >
            <Receipt className="mr-1.5 h-4 w-4" />
            View Bill
          </Button>
          {group.paymentStatus === 'unpaid' && (
            <Button
              onClick={() =>
                router.push(`/waiter/tables/${tableId}/new-order?groupId=${groupId}`)
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Order
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="active">
            Active
            {activeOrders.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {activeOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedOrders.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {completedOrders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'active' && (
        activeOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active orders. Tap &quot;New Order&quot; to start.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onEdit={(o) => setEditingOrder(o)}
                onSend={handleSend}
                onAcknowledge={handleAcknowledge}
                onServe={handleServe}
                unreadNotificationId={unreadNotifMap.get(order._id) ?? null}
                busy={busyOrderId === order._id}
              />
            ))}
          </div>
        )
      )}

      {tab === 'completed' && (
        completedOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed orders yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onEdit={() => {}}
                onSend={() => {}}
                onAcknowledge={() => {}}
                onServe={() => {}}
                unreadNotificationId={null}
                busy={false}
              />
            ))}
          </div>
        )
      )}

      <MenuItemPicker
        open={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        onSubmit={handleUpdateItems}
        title="Edit Order"
        initialItems={
          editingOrder
            ? editingOrder.items.map((i) => ({
                menuItemId: typeof i.menuItem === 'string' ? i.menuItem : i.menuItem._id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                specialInstructions: i.specialInstructions,
              }))
            : []
        }
      />

      <BillDialog
        groupId={groupId}
        open={billOpen}
        onClose={() => setBillOpen(false)}
        onPaid={handlePaid}
      />
    </div>
  );
}
