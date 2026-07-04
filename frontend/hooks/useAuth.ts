'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext, ROLE_HOME, type UserRole } from '@/context/AuthContext';

export function useAuth(requiredRole?: UserRole | UserRole[]) {
  const { user, loading, login, logout } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (requiredRole) {
      const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowed.includes(user.role)) {
        router.replace(ROLE_HOME[user.role]);
      }
    }
  }, [user, loading, requiredRole, router]);

  return { user, loading, login, logout };
}
