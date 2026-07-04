'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext, ROLE_HOME } from '@/context/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
