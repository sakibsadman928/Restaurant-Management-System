'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, LayoutGrid, Users } from 'lucide-react';
import api from '@/lib/api';
import StatCard from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return <p className="text-sm text-muted-foreground">Could not load dashboard.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Today&apos;s overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Orders" value={stats.todayOrders} icon={ShoppingBag} />
        <StatCard
          label="Today's Revenue"
          value={formatPrice(stats.todayRevenue)}
          icon={DollarSign}
          accent="text-emerald-600"
        />
        <StatCard
          label="Active Tables"
          value={stats.activeTables}
          icon={LayoutGrid}
          accent="text-amber-600"
        />
        <StatCard
          label="Active Staff"
          value={stats.totalStaff}
          icon={Users}
          accent="text-blue-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Dishes Today</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topDishes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders placed today yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topDishes.map((dish, idx) => (
                <div
                  key={dish._id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">{dish.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dish.totalOrdered} ordered
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
