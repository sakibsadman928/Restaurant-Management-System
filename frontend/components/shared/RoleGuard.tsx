'use client';

import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/context/AuthContext';

interface RoleGuardProps {
  role: UserRole | UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, loading } = useAuth(role);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
