'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import TableCard from '@/components/waiter/TableCard';
import type { Table } from '@/types';

export default function WaiterTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data.data.tables);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchTables, 10000);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading tables...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tables</h1>
        <p className="text-sm text-muted-foreground">
          {tables.length} table{tables.length !== 1 && 's'} assigned to you
        </p>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tables assigned yet. Contact your admin.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tables.map((table) => (
            <TableCard key={table._id} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}
