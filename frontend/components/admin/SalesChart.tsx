'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly';

interface SalesPoint {
  label: string;
  revenue: number;
  orderCount: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatLabel(id: any, period: Period): string {
  if (period === 'daily') {
    // Split the 'YYYY-MM-DD' string directly — avoids UTC→local timezone offset
    // shifting the date by one day in timezones behind UTC
    const parts = (id as string).split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  }
  if (period === 'weekly') {
    // Include year so W1 is unambiguous when the chart spans a year boundary
    return `W${id.week} '${String(id.year).slice(-2)}`;
  }
  return `${MONTHS[id.month - 1]} '${String(id.year).slice(-2)}`;
}

export default function SalesChart() {
  const [period, setPeriod] = useState<Period>('daily');
  const [points, setPoints] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/reports/sales', { params: { period } })
      .then(({ data }) => {
        const mapped = data.data.data.map((d: any) => ({
          label: formatLabel(d._id, period),
          revenue: d.revenue,
          orderCount: d.orderCount,
        }));
        setPoints(mapped);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const totalRevenue = useMemo(
    () => points.reduce((sum, p) => sum + p.revenue, 0),
    [points]
  );

  const totalOrders = useMemo(
    () => points.reduce((sum, p) => sum + p.orderCount, 0),
    [points]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Sales Revenue</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatPrice(totalRevenue)} · {totalOrders} orders
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Loading chart...
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No sales data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={points}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Revenue']}
                labelFormatter={(label) => {
                  const point = points.find((p) => p.label === label);
                  return point
                    ? `${label}  ·  ${point.orderCount} order${point.orderCount !== 1 ? 's' : ''}`
                    : label;
                }}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
