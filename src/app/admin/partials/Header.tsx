'use client';

import React from 'react';
import { Button } from '@frontend/components/ui/button';
import { Menu } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@frontend/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@frontend/components/ui/avatar';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-zinc-400"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={language === 'pt' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('pt')}
            className={language === 'pt' ? 'bg-emerald-600 hover:bg-emerald-500' : ''}
          >
            PT
          </Button>
          <Button
            variant={language === 'en' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'bg-emerald-600 hover:bg-emerald-500' : ''}
          >
            EN
          </Button>
        </div>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-500 text-white">
                  A
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm text-zinc-300">
                {t.admin.administrator}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
            <DropdownMenuItem className="text-zinc-300">
              {t.admin.myAccount}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
            >
              {t.admin.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

