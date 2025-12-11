'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@frontend/components/ui/button';
import { ScrollArea } from '@frontend/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Badge } from '@frontend/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@frontend/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  Key,
  Download,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Globe,
  ArrowLeft,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoSmallContrast } from '@frontend/components/shared/Logo';
import { useTranslation } from '@/lib/i18n';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  image?: string;
}

const getAdminSidebarItems = (t: any) => [
  { href: '/admin', label: t.admin.sidebar.dashboard, icon: LayoutDashboard },
  { href: '/admin/users', label: t.admin.sidebar.users, icon: Users },
  { href: '/admin/api-keys', label: t.admin.sidebar.apiKeys, icon: Key },
  { href: '/admin/test-area', label: t.admin.sidebar.testArea, icon: Play },
  { href: '/admin/downloads', label: t.admin.sidebar.downloads, icon: Download },
  { href: '/admin/payments', label: t.admin.sidebar.payments, icon: CreditCard },
  { href: '/admin/analytics', label: t.admin.sidebar.analytics, icon: BarChart3 },
  { href: '/admin/notifications', label: t.admin.sidebar.notifications, icon: Bell },
  { href: '/admin/settings', label: t.admin.sidebar.settings, icon: Settings },
];

function LanguageToggle() {
  const { language, setLanguage } = useTranslation();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-zinc-400 hover:text-white">
          <Globe className="h-4 w-4" />
          <span>{language === 'pt' ? 'PT' : 'EN'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
        <DropdownMenuItem 
          onClick={() => setLanguage('pt')}
          className={`cursor-pointer ${language === 'pt' ? 'bg-zinc-800' : ''}`}
        >
          🇧🇷 Português
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={`cursor-pointer ${language === 'en' ? 'bg-zinc-800' : ''}`}
        >
          🇺🇸 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const sidebarItems = getAdminSidebarItems(t);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role === 'admin') {
            setUser(data.user);
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Erro ao verificar acesso admin:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success(t.common.success);
      router.push('/');
    } catch {
      toast.error(t.common.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
          <p className="text-zinc-400">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
            <Link href="/admin" className="flex items-center gap-2">
              <LogoSmallContrast size={32} />
              <span className="font-bold text-lg text-white">MediaGrab</span>
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

          {/* Admin Badge */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t.admin.dashboard.title}</span>
              <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                <Shield className="h-3 w-3 mr-1" />
                {t.admin.administrator}
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t border-zinc-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-2 py-6 hover:bg-zinc-800">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image} />
                    <AvatarFallback className="bg-red-600 text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel className="text-zinc-400">{t.admin.myAccount}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem asChild>
                  <Link href="/" className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.common.back}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t.admin.sidebar.settings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.admin.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
          <div className="flex items-center justify-between h-full px-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-zinc-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <LanguageToggle />
              
              {/* Back to Home */}
              <Link href="/">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.common.back}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
