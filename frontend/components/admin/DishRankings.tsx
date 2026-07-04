'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DishRank {
  _id: string;
  name: string;
  totalOrdered: number;
}

export default function DishRankings() {
  const [mostOrdered, setMostOrdered] = useState<DishRank[]>([]);
  const [leastOrdered, setLeastOrdered] = useState<DishRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/reports/dishes')
      .then(({ data }) => {
        setMostOrdered(data.data.mostOrdered);
        setLeastOrdered(data.data.leastOrdered);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Loading dish rankings...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Most Ordered
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mostOrdered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No order data yet.</p>
          ) : (
            <div className="space-y-2">
              {mostOrdered.map((dish, idx) => (
                <div
                  key={dish._id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            Least Ordered
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leastOrdered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No order data yet.</p>
          ) : (
            <div className="space-y-2">
              {leastOrdered.map((dish, idx) => (
                <div
                  key={dish._id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
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
