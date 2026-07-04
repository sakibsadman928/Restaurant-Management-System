'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminTableCard from '@/components/admin/AdminTableCard';
import TableForm from '@/components/admin/TableForm';
import AssignWaiterDialog from '@/components/admin/AssignWaiterDialog';
import type { Table } from '@/types';

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningTable, setAssigningTable] = useState<Table | null>(null);

  const fetchTables = useCallback(async () => {
    const { data } = await api.get('/tables');
    setTables(data.data.tables);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const openCreate = () => {
    setEditingTable(null);
    setFormOpen(true);
  };

  const openEdit = (table: Table) => {
    setEditingTable(table);
    setFormOpen(true);
  };

  const openAssign = (table: Table) => {
    setAssigningTable(table);
    setAssignOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading tables...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tables</h1>
          <p className="text-sm text-muted-foreground">{tables.length} tables total</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Table
        </Button>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tables created yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...tables]
            .sort((a, b) => a.tableNumber - b.tableNumber)
            .map((table) => (
              <AdminTableCard
                key={table._id}
                table={table}
                onEdit={openEdit}
                onAssign={openAssign}
                onChanged={fetchTables}
              />
            ))}
        </div>
      )}

      <TableForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchTables}
        table={editingTable}
      />

      <AssignWaiterDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSaved={fetchTables}
        table={assigningTable}
      />
    </div>
  );
}
