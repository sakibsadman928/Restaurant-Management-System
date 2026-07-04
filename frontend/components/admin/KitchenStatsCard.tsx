'use client';

import { useEffect, useState } from 'react';
import { Clock, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KitchenStats {
  avgPrepTimeMinutes: number | null;
  minPrepTimeMinutes: number | null;
  maxPrepTimeMinutes: number | null;
  totalMeasured: number;
}

function formatMinutes(mins: number | null): string {
  if (mins === null) return '—';
  const m = Math.round(mins);
  if (m < 1) return '< 1 min';
  return `${m} min${m !== 1 ? 's' : ''}`;
}

export default function KitchenStatsCard() {
  const [stats, setStats] = useState<KitchenStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports/kitchen')
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kitchen Performance</CardTitle>
        <p className="text-sm text-muted-foreground">
          Order sent → ready prep time
          {stats && stats.totalMeasured > 0 && (
            <span className="ml-1">· {stats.totalMeasured} orders measured</span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
        ) : !stats || stats.totalMeasured === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No prep time data yet. Data appears after orders are sent to kitchen and marked ready.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center rounded-lg bg-muted/50 p-4">
              <TrendingDown className="mb-2 h-5 w-5 text-emerald-600" />
              <p className="text-xl font-bold">{formatMinutes(stats.minPrepTimeMinutes)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Fastest</p>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-primary/10 p-4">
              <Clock className="mb-2 h-5 w-5 text-primary" />
              <p className="text-xl font-bold">{formatMinutes(stats.avgPrepTimeMinutes)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Average</p>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-muted/50 p-4">
              <TrendingUp className="mb-2 h-5 w-5 text-rose-500" />
              <p className="text-xl font-bold">{formatMinutes(stats.maxPrepTimeMinutes)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Slowest</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
