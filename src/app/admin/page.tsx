'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { Button } from '@frontend/components/ui/button';
import { Badge } from '@frontend/components/ui/badge';
import { Avatar, AvatarFallback } from '@frontend/components/ui/avatar';
import {
  Download,
  Users,
  Key,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowRight,
  Crown,
  Globe,
  Youtube,
  Instagram,
  Music,
  CreditCard,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            {loading ? (
              <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-white">{value}</p>
            )}
            {trend && !loading && (
              <p className={`text-sm flex items-center gap-1 ${trend.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                <TrendingUp className="h-3 w-3" />
                {trend.label}
              </p>
            )}
            {subtitle && !trend && !loading && (
              <p className="text-sm text-zinc-500">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  iconBg,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  iconBg: string;
}) {
  return (
    <Link href={href}>
      <Card className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all group cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                {title}
              </p>
              <p className="text-sm text-zinc-500">{description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Recent Users Component
function RecentUsers() {
  const { data, isLoading } = useSWR('/api/admin/users?limit=5', fetcher);
  const users = data?.users || [];

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'enterprise': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'startup': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'developer': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Usuários Recentes
        </CardTitle>
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-zinc-800 rounded-lg animate-pulse" />
          ))
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500">Nenhum usuário ainda</p>
          </div>
        ) : (
          users.slice(0, 5).map((user: any, idx: number) => (
            <div
              key={user._id || idx}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-zinc-700 text-white text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {idx === 0 && (
                    <Crown className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name || 'Usuário'}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>
              <Badge variant="outline" className={getPlanColor(user.plan)}>
                {user.plan || 'free'}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Recent Downloads Component
function RecentDownloads() {
  const { data, isLoading } = useSWR('/api/admin/stats/recent-downloads', fetcher);
  const downloads = data?.downloads || [];

  const getPlatformIcon = (platform: string) => {
    const p = platform?.toLowerCase() || '';
    if (p.includes('youtube')) return <Youtube className="h-4 w-4 text-red-500" />;
    if (p.includes('instagram')) return <Instagram className="h-4 w-4 text-pink-500" />;
    if (p.includes('tiktok')) return <Music className="h-4 w-4 text-cyan-500" />;
    return <Globe className="h-4 w-4 text-zinc-500" />;
  };

  const getPlatformColor = (platform: string) => {
    const p = platform?.toLowerCase() || '';
    if (p.includes('youtube')) return 'bg-red-500/10 text-red-500 border-red-500/30';
    if (p.includes('instagram')) return 'bg-pink-500/10 text-pink-500 border-pink-500/30';
    if (p.includes('tiktok')) return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30';
    return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30';
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Download className="h-5 w-5 text-emerald-500" />
          Downloads Recentes
        </CardTitle>
        <Link href="/admin/downloads">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-zinc-800 rounded-lg animate-pulse" />
          ))
        ) : downloads.length === 0 ? (
          <div className="text-center py-8">
            <Download className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500">Nenhum download ainda</p>
          </div>
        ) : (
          downloads.slice(0, 5).map((download: any, idx: number) => (
            <div
              key={download._id || idx}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getPlatformIcon(download.platform)}
                <div className="min-w-0">
                  <p className="text-sm text-white truncate max-w-[180px]">
                    {download.url?.replace(/https?:\/\/(www\.)?/, '').split('/')[0] || 'URL'}
                  </p>
                  <p className="text-xs text-zinc-500">{download.username || 'Anônimo'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getPlatformColor(download.platform)}>
                  {download.platform || 'Unknown'}
                </Badge>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {formatTimeAgo(download.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Platform Stats Component
function PlatformStats() {
  const { data, isLoading } = useSWR('/api/admin/analytics', fetcher);
  const platforms = data?.downloadsByPlatform || [];

  const getPlatformColor = (platform: string) => {
    const p = platform?.toLowerCase() || '';
    if (p.includes('youtube')) return 'bg-red-500';
    if (p.includes('instagram')) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (p.includes('tiktok')) return 'bg-cyan-500';
    if (p.includes('twitter')) return 'bg-blue-500';
    return 'bg-zinc-500';
  };

  const total = platforms.reduce((acc: number, p: any) => acc + p.count, 0);

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          Downloads por Plataforma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />
          ))
        ) : platforms.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500">Sem dados ainda</p>
          </div>
        ) : (
          platforms.map((platform: any, idx: number) => {
            const percentage = total > 0 ? (platform.count / total) * 100 : 0;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white capitalize">{platform._id}</span>
                  <span className="text-zinc-400">
                    {percentage.toFixed(0)}% ({platform.count})
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getPlatformColor(platform._id)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t, language } = useTranslation();

  // Fetch stats
  const { data: downloadsData, isLoading: loadingDownloads } = useSWR('/api/admin/stats/total-downloads', fetcher);
  const { data: usersData, isLoading: loadingUsers } = useSWR('/api/admin/stats/total-users', fetcher);
  const { data: apiKeysData, isLoading: loadingApiKeys } = useSWR('/api/admin/stats/total-api-keys', fetcher);
  const { data: paymentsData, isLoading: loadingPayments } = useSWR('/api/admin/payments', fetcher);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {t.admin.dashboard.title}
        </h1>
        <p className="text-zinc-400 mt-1">{t.admin.dashboard.welcome}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t.admin.dashboard.totalDownloads}
          value={downloadsData?.total?.toLocaleString() || '0'}
          icon={Download}
          iconColor="bg-emerald-500/10 text-emerald-500"
          trend={downloadsData?.today > 0 ? { value: downloadsData.today, label: `+${downloadsData.today} hoje` } : undefined}
          loading={loadingDownloads}
        />
        <StatsCard
          title={t.admin.dashboard.totalUsers}
          value={usersData?.total?.toLocaleString() || '0'}
          icon={Users}
          iconColor="bg-blue-500/10 text-blue-500"
          trend={usersData?.activeToday > 0 ? { value: usersData.activeToday, label: `${usersData.activeToday} ativos` } : undefined}
          loading={loadingUsers}
        />
        <StatsCard
          title={t.admin.dashboard.totalApiKeys}
          value={apiKeysData?.total?.toLocaleString() || '0'}
          icon={Key}
          iconColor="bg-amber-500/10 text-amber-500"
          subtitle={apiKeysData?.active > 0 ? `${apiKeysData.active} ativas` : undefined}
          loading={loadingApiKeys}
        />
        <StatsCard
          title={t.admin.dashboard.revenue}
          value={formatCurrency(paymentsData?.stats?.totalRevenue || 0)}
          icon={DollarSign}
          iconColor="bg-green-500/10 text-green-500"
          subtitle="Este mês"
          loading={loadingPayments}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Gerenciar Usuários"
          description="Ver e editar contas"
          href="/admin/users"
          icon={Users}
          iconBg="bg-blue-500/10 text-blue-500"
        />
        <QuickActionCard
          title="Ver Pagamentos"
          description="Histórico de transações"
          href="/admin/payments"
          icon={CreditCard}
          iconBg="bg-green-500/10 text-green-500"
        />
        <QuickActionCard
          title="Analytics"
          description="Estatísticas do sistema"
          href="/admin/analytics"
          icon={Activity}
          iconBg="bg-purple-500/10 text-purple-500"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentUsers />
        <RecentDownloads />
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformStats />
      </div>
    </div>
  );
}
