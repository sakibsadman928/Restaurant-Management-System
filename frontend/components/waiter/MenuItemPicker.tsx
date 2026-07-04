'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types';

export interface DraftItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

interface MenuItemPickerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: DraftItem[]) => Promise<void>;
  initialItems?: DraftItem[];
  title?: string;
}

export default function MenuItemPicker({
  open,
  onClose,
  onSubmit,
  initialItems = [],
  title = 'New Order',
}: MenuItemPickerProps) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [draft, setDraft] = useState<DraftItem[]>(initialItems);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(initialItems);
    setLoading(true);
    api
      .get('/menu', { params: { available: true } })
      .then(({ data }) => setMenu(data.data.items))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = useMemo(
    () => draft.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [draft]
  );

  const categories = useMemo(
    () => Array.from(new Set(menu.map((m) => m.category))),
    [menu]
  );

  const addItem = (item: MenuItem) => {
    setDraft((prev) => {
      const existing = prev.find((d) => d.menuItemId === item._id);
      if (existing) {
        return prev.map((d) =>
          d.menuItemId === item._id ? { ...d, quantity: d.quantity + 1 } : d
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          specialInstructions: '',
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setDraft((prev) =>
      prev
        .map((d) => (d.menuItemId === id ? { ...d, quantity: d.quantity + delta } : d))
        .filter((d) => d.quantity > 0)
    );
  };

  const updateNote = (id: string, note: string) => {
    setDraft((prev) =>
      prev.map((d) => (d.menuItemId === id ? { ...d, specialInstructions: note } : d))
    );
  };

  const removeItem = (id: string) => {
    setDraft((prev) => prev.filter((d) => d.menuItemId !== id));
  };

  const handleSubmit = async () => {
    if (draft.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(draft);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">MENU</p>
            <ScrollArea className="h-72 rounded-md border">
              <div className="p-2">
                {loading ? (
                  <p className="p-3 text-sm text-muted-foreground">Loading menu...</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat} className="mb-3">
                      <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {cat}
                      </p>
                      {menu
                        .filter((m) => m.category === cat)
                        .map((item) => (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => addItem(item)}
                            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                          >
                            <span>{item.name}</span>
                            <span className="text-muted-foreground">
                              {formatPrice(item.price)}
                            </span>
                          </button>
                        ))}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">ORDER</p>
            <ScrollArea className="h-72 rounded-md border">
              <div className="space-y-3 p-3">
                {draft.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items added yet</p>
                ) : (
                  draft.map((item) => (
                    <div key={item.menuItemId} className="space-y-1.5 border-b pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <button type="button" onClick={() => removeItem(item.menuItemId)}>
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQty(item.menuItemId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQty(item.menuItemId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-auto text-sm text-muted-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                      <Textarea
                        placeholder="Special instructions (optional)"
                        value={item.specialInstructions}
                        onChange={(e) => updateNote(item.menuItemId, e.target.value)}
                        className="h-14 resize-none text-xs"
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-sm font-semibold">Total: {formatPrice(total)}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={draft.length === 0 || submitting} onClick={handleSubmit}>
              {submitting ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
