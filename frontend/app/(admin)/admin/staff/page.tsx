'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StaffTable from '@/components/admin/StaffTable';
import StaffForm from '@/components/admin/StaffForm';
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog';
import type { User } from '@/types';

type FilterTab = 'all' | 'waiter' | 'chef';

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resettingStaff, setResettingStaff] = useState<User | null>(null);

  const fetchStaff = useCallback(async () => {
    const { data } = await api.get('/admin/staff');
    setStaff(data.data.staff);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filtered = useMemo(
    () => (tab === 'all' ? staff : staff.filter((s) => s.role === tab)),
    [staff, tab]
  );

  const openCreate = () => {
    setEditingStaff(null);
    setFormOpen(true);
  };

  const openEdit = (member: User) => {
    setEditingStaff(member);
    setFormOpen(true);
  };

  const openReset = (member: User) => {
    setResettingStaff(member);
    setResetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading staff...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">{staff.length} accounts total</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="waiter">Waiters</TabsTrigger>
          <TabsTrigger value="chef">Chefs</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No staff accounts found.
            </p>
          ) : (
            <StaffTable
              staff={filtered}
              onEdit={openEdit}
              onResetPassword={openReset}
              onChanged={fetchStaff}
            />
          )}
        </CardContent>
      </Card>

      <StaffForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchStaff}
        staff={editingStaff}
      />

      <ResetPasswordDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        staff={resettingStaff}
      />
    </div>
  );
}
