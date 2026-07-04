'use client';

import { useState, useEffect } from 'react';
import { Banknote, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPrice, cn } from '@/lib/utils';
import type { Order } from '@/types';

interface BillDialogProps {
  groupId: string;
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
}

export default function BillDialog({ groupId, open, onClose, onPaid }: BillDialogProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [method, setMethod] = useState<'cash' | 'card' | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    setMethod(null);
    api
      .get(`/groups/${groupId}/bill`)
      .then(({ data }) => {
        setOrders(data.data.orders);
        setTotal(data.data.total);
      })
      .finally(() => setLoading(false));
  }, [open, groupId]);

  const handlePay = async () => {
    if (!method) return;
    setPaying(true);
    setError('');
    try {
      await api.post(`/groups/${groupId}/pay`, { paymentMethod: method });
      onPaid();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Group Bill</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading bill...</p>
        ) : orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No unpaid orders.</p>
        ) : (
          <>
            <div className="max-h-60 space-y-3 overflow-y-auto">
              {orders.map((order) => (
                <div key={order._id} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}× {item.name}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">PAYMENT METHOD</p>
              <div className="grid grid-cols-2 gap-2">
                {(['cash', 'card'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-md border py-2 text-sm font-medium transition-colors capitalize',
                      method === m
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-accent'
                    )}
                  >
                    {m === 'cash' ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {orders.length > 0 && (
            <Button disabled={!method || paying} onClick={handlePay}>
              {paying ? 'Processing...' : 'Complete Payment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
