'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

interface DishRevRow {
  name: string;
  totalRevenue: number;
  totalQuantity: number;
}

export default function DishRevenueChart() {
  const [data, setData] = useState<DishRevRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports/dish-revenue')
      .then(({ data: res }) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 16 ? d.name.slice(0, 14) + '…' : d.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dish Revenue Contribution</CardTitle>
        <p className="text-sm text-muted-foreground">Top 10 dishes by total money earned</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data yet.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {data.map((row, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                  <span className="truncate text-muted-foreground max-w-[60%]">{row.name}</span>
                  <div className="flex gap-4 shrink-0">
                    <span className="text-muted-foreground">{row.totalQuantity} sold</span>
                    <span className="font-semibold">{formatPrice(row.totalRevenue)}</span>
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
