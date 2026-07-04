'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

interface CategoryRow {
  _id: string;
  revenue: number;
  quantity: number;
}

const COLORS = [
  'hsl(var(--primary))',
  '#60a5fa',
  '#34d399',
  '#f59e0b',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
];

export default function CategoryBreakdown() {
  const [data, setData] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports/categories')
      .then(({ data: res }) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = useMemo(() => data.reduce((sum, d) => sum + d.revenue, 0), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Category Breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">Revenue and quantity sold per menu category</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data yet.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {data.map((row, idx) => {
                const pct = totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(1) : '0';
                return (
                  <div key={row._id} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    <span className="flex-1 text-sm">{row._id}</span>
                    <span className="text-xs text-muted-foreground">{row.quantity} items</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                    <span className="text-sm font-semibold w-20 text-right">{formatPrice(row.revenue)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
