'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface DishCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onChanged: () => void;
}

export default function DishCard({ item, onEdit, onChanged }: DishCardProps) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/menu/${item._id}/availability`);
      onChanged();
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/menu/${item._id}`);
      onChanged();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full bg-muted">
        {item.image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image.url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.category}</p>
          </div>
          <span className="text-sm font-semibold">{formatPrice(item.price)}</span>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        )}

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={item.isAvailable}
              disabled={toggling}
              onCheckedChange={handleToggle}
            />
            <span className="text-xs text-muted-foreground">
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(item)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
