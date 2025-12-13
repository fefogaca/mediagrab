'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@frontend/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const menuItems = [
    { href: '/admin', label: t.admin.sidebar.dashboard, icon: '📊' },
    { href: '/admin/users', label: t.admin.sidebar.users, icon: '👥' },
    { href: '/admin/installations', label: t.admin.sidebar.installations, icon: '🤖' },
    { href: '/admin/api-keys', label: t.admin.sidebar.apiKeys, icon: '🔑' },
    { href: '/admin/downloads', label: t.admin.sidebar.downloads, icon: '⬇️' },
    { href: '/admin/payments', label: t.admin.sidebar.payments, icon: '💳' },
    { href: '/admin/analytics', label: t.admin.sidebar.analytics, icon: '📈' },
    { href: '/admin/notifications', label: t.admin.sidebar.notifications, icon: '🔔' },
    { href: '/admin/settings', label: t.admin.sidebar.settings, icon: '⚙️' },
  ];

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-bold text-lg text-white">Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-zinc-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

