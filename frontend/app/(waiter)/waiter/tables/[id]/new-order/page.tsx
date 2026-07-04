'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Minus, X } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatPrice, cn } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
  imageUrl: string;
}

function NewOrderInner() {
  const { id: tableId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const router = useRouter();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/menu', { params: { available: true } })
      .then(({ data }) => setMenu(data.data.items))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(menu.map((m) => m.category)))],
    [menu]
  );

  const filtered = useMemo(
    () => (activeCategory === 'All' ? menu : menu.filter((m) => m.category === activeCategory)),
    [menu, activeCategory]
  );

  const total = useMemo(() => cart.reduce((s, c) => s + c.price * c.quantity, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((s, c) => s + c.quantity, 0), [cart]);
  const getQty = (itemId: string) => cart.find((c) => c.menuItemId === itemId)?.quantity ?? 0;

  const addItem = (item: MenuItem) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItemId === item._id);
      if (ex) return prev.map((c) => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, specialInstructions: '', imageUrl: item.image?.url || '' }];
    });
  };

  const changeQty = (menuItemId: string, delta: number) =>
    setCart((prev) => prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0));

  const updateNote = (menuItemId: string, note: string) =>
    setCart((prev) => prev.map((c) => c.menuItemId === menuItemId ? { ...c, specialInstructions: note } : c));

  const handleSubmit = async () => {
    if (cart.length === 0 || !groupId) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/orders', {
        groupId,
        items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity, specialInstructions: c.specialInstructions })),
      });
      router.push(`/waiter/tables/${tableId}/groups/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
      setSubmitting(false);
    }
  };

  return (
    <div className="-m-6 flex flex-col overflow-hidden bg-background" style={{ height: '100vh' }}>
      <div className="flex items-center gap-3 border-b px-6 py-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight">New Order</h1>
          <p className="text-xs text-muted-foreground">Group {groupId?.slice(-4).toUpperCase()}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex gap-2 overflow-x-auto border-b px-4 py-3 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {loading ? (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Loading menu...</p>
              ) : (
                filtered.map((item) => {
                  const qty = getQty(item._id);
                  return (
                    <div key={item._id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                      <div className="aspect-video w-full bg-muted">
                        {item.image?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image.url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                        )}
                      </div>
                      <div className="space-y-2 p-3">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{item.name}</p>
                          {item.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>}
                          <p className="mt-1 text-sm font-bold">{formatPrice(item.price)}</p>
                        </div>
                        {qty === 0 ? (
                          <Button size="sm" className="w-full" onClick={() => addItem(item)}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Add
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(item._id, -1)}><Minus className="h-3 w-3" /></Button>
                            <span className="text-sm font-bold">{qty}</span>
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(item._id, 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex w-72 shrink-0 flex-col border-l bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
            <h2 className="font-semibold">Cart</h2>
            <span className="text-sm text-muted-foreground">{totalItems} item{totalItems !== 1 && 's'}</span>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {cart.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Tap items to add them</p>
              ) : (
                cart.map((item) => (
                  <div key={item.menuItemId} className="space-y-2">
                    <div className="flex items-start gap-2">
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                      <button type="button" onClick={() => changeQty(item.menuItemId, -item.quantity)}>
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => changeQty(item.menuItemId, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => changeQty(item.menuItemId, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Textarea
                      placeholder="Special instructions..."
                      value={item.specialInstructions}
                      onChange={(e) => updateNote(item.menuItemId, e.target.value)}
                      className="h-12 resize-none text-xs"
                    />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="shrink-0 space-y-3 border-t p-4">
            <Separator />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            {error && <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">{error}</p>}
            <Button className="w-full" disabled={cart.length === 0 || submitting || !groupId} onClick={handleSubmit}>
              {submitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense>
      <NewOrderInner />
    </Suspense>
  );
}
