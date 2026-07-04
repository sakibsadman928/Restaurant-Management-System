'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrice } from '@/lib/utils';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface TodayStat {
  _id: string;
  name: string;
  orderCount: number;
  revenue: number;
}

interface MonthlyStat {
  waiterName: string;
  year: number;
  month: number;
  orderCount: number;
  revenue: number;
}

export default function StaffReport() {
  const [todayStats, setTodayStats] = useState<TodayStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'today' | 'monthly'>('today');

  useEffect(() => {
    api.get('/admin/reports/staff')
      .then(({ data }) => {
        setTodayStats(data.data.todayStats);
        setMonthlyStats(data.data.monthlyStats);
      })
      .finally(() => setLoading(false));
  }, []);

  const waiterNames = Array.from(new Set(monthlyStats.map((r) => r.waiterName)));
  const [selectedWaiter, setSelectedWaiter] = useState<string>('');

  useEffect(() => {
    if (waiterNames.length > 0 && !selectedWaiter) setSelectedWaiter(waiterNames[0]);
  }, [waiterNames.length]);

  const filteredMonthly = monthlyStats.filter((r) => r.waiterName === selectedWaiter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Staff Performance</CardTitle>
        <p className="text-sm text-muted-foreground">Orders handled and revenue per waiter</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'today' | 'monthly')}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
        ) : tab === 'today' ? (
          todayStats.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No completed orders today yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waiter</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayStats.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">{row.orderCount}</TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          monthlyStats.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No monthly data yet.</p>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                {waiterNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedWaiter(name)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedWaiter === name
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {filteredMonthly.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data for this waiter.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMonthly.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{MONTHS[row.month - 1]} {row.year}</TableCell>
                        <TableCell className="text-right">{row.orderCount}</TableCell>
                        <TableCell className="text-right font-semibold">{formatPrice(row.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
