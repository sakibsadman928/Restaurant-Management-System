import { cn } from '@/lib/utils';
import type { OrderStatus, TableStatus, PaymentStatus } from '@/types';

type Status = OrderStatus | TableStatus | PaymentStatus;

const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  preparing: 'bg-amber-100 text-amber-700 border-amber-200',
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  served: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-slate-100 text-slate-500 border-slate-200',
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  occupied: 'bg-rose-100 text-rose-700 border-rose-200',
  unpaid: 'bg-rose-100 text-rose-700 border-rose-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status],
        className
      )}
    >
      {status}
    </span>
  );
}
