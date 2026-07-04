'use client';

import { useState } from 'react';
import { Pencil, KeyRound, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';

interface StaffTableProps {
  staff: User[];
  onEdit: (staff: User) => void;
  onResetPassword: (staff: User) => void;
  onChanged: () => void;
}

export default function StaffTable({
  staff,
  onEdit,
  onResetPassword,
  onChanged,
}: StaffTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleToggleActive = async (id: string) => {
    setBusyId(id);
    try {
      await api.put(`/admin/staff/${id}/toggle-active`);
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (member: User) => {
    if (!confirm(`Delete ${member.name}'s account? This cannot be undone.`)) return;
    setBusyId(member._id);
    try {
      await api.delete(`/admin/staff/${member._id}`);
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Staff</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => (
          <TableRow key={member._id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm capitalize">{member.role}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={member.isActive}
                  disabled={busyId === member._id}
                  onCheckedChange={() => handleToggleActive(member._id)}
                />
                <span className="text-xs text-muted-foreground">
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onEdit(member)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onResetPassword(member)}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  disabled={busyId === member._id}
                  onClick={() => handleDelete(member)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
