'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

interface TableRevRow {
  tableNumber: number;
  revenue: number;
  orderCount: number;
}

export default function TableRevenueChart() {
  const [data, setData] = useState<TableRevRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports/table-revenue')
      .then(({ data: res }) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue per Table</CardTitle>
        <p className="text-sm text-muted-foreground">All-time paid orders sorted by revenue</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data yet.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="tableNumber" tickFormatter={(v) => `T${v}`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value, name) => {
                    const formattedValue =
                      name === 'revenue'
                        ? formatPrice(typeof value === 'number' ? value : Number(value ?? 0))
                        : value === undefined
                        ? ''
                        : String(value);

                    return [formattedValue, name === 'revenue' ? 'Revenue' : 'Orders'] as [string, string];
                  }}
                  labelFormatter={(label) => `Table ${label}`}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1">
              {data.map((row) => (
                <div key={row.tableNumber} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                  <span className="text-muted-foreground">Table {row.tableNumber}</span>
                  <div className="flex gap-6">
                    <span className="text-muted-foreground">{row.orderCount} orders</span>
                    <span className="font-semibold">{formatPrice(row.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
