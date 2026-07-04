'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut, UtensilsCrossed, LayoutGrid, Bell,
  ChefHat, LayoutDashboard, Users, BarChart3,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { usePolling } from '@/hooks/usePolling';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid, Bell, ChefHat, LayoutDashboard, UtensilsCrossed, Users, BarChart3,
};

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
}

export default function Sidebar({ navItems }: SidebarProps) {
  const { user, logout } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (user?.role !== 'waiter') return;
    try {
      const { data } = await api.get('/notifications');
      setUnreadCount(data.data.notifications.length);
    } catch {}
  }, [user?.role]);

  usePolling(fetchUnread, 8000, user?.role === 'waiter');

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">RestaurantOS</span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = pathname.startsWith(item.href);
          const isNotif = item.icon === 'Bell';

          return (
            <Link key={item.href} href={item.href}>
              <span className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}>
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="flex-1">{item.label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className={cn(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                    isActive
                      ? 'bg-primary-foreground text-primary'
                      : 'bg-primary text-primary-foreground'
                  )}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-muted">
              {user ? getInitials(user.name) : '??'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
