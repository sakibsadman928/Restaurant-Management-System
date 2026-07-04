'use client';

import { Users, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatPrice } from '@/lib/utils';
import type { Group } from '@/types';

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

export default function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {group.groupLabel}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{group.groupLabel}</p>
              <StatusBadge status={group.paymentStatus} />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Users className="h-3 w-3" />
              {group.guestCount} guest{group.guestCount !== 1 ? 's' : ''}
              {group.paymentStatus === 'unpaid' && group.activeOrderCount !== undefined && (
                <>
                  <span className="mx-1">·</span>
                  {group.activeOrderCount} active order{group.activeOrderCount !== 1 ? 's' : ''}
                  {group.runningTotal ? ` · ${formatPrice(group.runningTotal)}` : ''}
                </>
              )}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </button>
  );
}
