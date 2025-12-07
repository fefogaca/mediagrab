"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import { Progress } from "@frontend/components/ui/progress";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Key,
  Activity,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Stats {
  users: { total: number; activeToday: number };
  downloads: { total: number; today: number; last7Days: number; byPlatform: { _id: string; count: number }[] };
  apiKeys: { total: number; totalRequests: number };
}

export default function AnalyticsPage() {
  const { t, language } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    users: { total: 0, activeToday: 0 },
    downloads: { total: 0, today: 0, last7Days: 0, byPlatform: [] },
    apiKeys: { total: 0, totalRequests: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, downloadsRes, apiKeysRes] = await Promise.all([
        fetch("/api/admin/stats/total-users"),
        fetch("/api/admin/stats/total-downloads"),
        fetch("/api/admin/stats/total-api-keys"),
      ]);

      const usersData = await usersRes.json().catch(() => ({}));
      const downloadsData = await downloadsRes.json().catch(() => ({}));
      const apiKeysData = await apiKeysRes.json().catch(() => ({}));

      setStats({
        users: {
          total: usersData.total || 0,
          activeToday: usersData.activeToday || 0,
        },
        downloads: {
          total: downloadsData.total || 0,
          today: downloadsData.today || 0,
          last7Days: downloadsData.last7Days || 0,
          byPlatform: downloadsData.byPlatform || [],
        },
        apiKeys: {
          total: apiKeysData.total || 0,
          totalRequests: apiKeysData.totalRequests || 0,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      toast.error(t.admin.analytics.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  // Calcular percentuais por plataforma
  const totalPlatformDownloads = stats.downloads.byPlatform.reduce((sum, p) => sum + p.count, 0);
  const platformStats = stats.downloads.byPlatform.map(p => ({
    name: p._id || t.admin.downloads.platform.other,
    percentage: totalPlatformDownloads > 0 ? Math.round((p.count / totalPlatformDownloads) * 100) : 0,
    count: p.count,
    color: getPlatformColor(p._id),
  }));

  function getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
      youtube: "bg-red-500",
      instagram: "bg-pink-500",
      tiktok: "bg-cyan-500",
      twitter: "bg-blue-500",
    };
    return colors[platform?.toLowerCase()] || "bg-zinc-500";
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t.admin.analytics.title}</h1>
        <p className="text-zinc-400 mt-1">{t.admin.analytics.subtitle}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Download className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t.admin.analytics.stats.downloadsToday}</p>
                <p className="text-2xl font-bold text-white">{stats.downloads.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t.admin.analytics.stats.activeUsersToday}</p>
                <p className="text-2xl font-bold text-white">{stats.users.activeToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t.admin.analytics.stats.totalRequests}</p>
                <p className="text-2xl font-bold text-white">{stats.apiKeys.totalRequests.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Key className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t.admin.analytics.stats.totalApiKeys}</p>
                <p className="text-2xl font-bold text-white">{stats.apiKeys.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Downloads Summary */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              {t.admin.analytics.stats.totalDownloads}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.analytics.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                <div>
                  <p className="text-sm text-zinc-400">{t.admin.analytics.stats.totalDownloads}</p>
                  <p className="text-xl font-bold text-white">{stats.downloads.total.toLocaleString()}</p>
                </div>
                <Download className="h-8 w-8 text-emerald-500/50" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                <div>
                  <p className="text-sm text-zinc-400">{t.admin.analytics.stats.downloadsToday}</p>
                  <p className="text-xl font-bold text-white">{stats.downloads.today}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500/50" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                <div>
                  <p className="text-sm text-zinc-400">{t.admin.analytics.stats.downloadsLast7Days}</p>
                  <p className="text-xl font-bold text-white">{stats.downloads.last7Days}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              {t.admin.analytics.stats.downloadsByPlatform}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.analytics.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {platformStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">{t.admin.analytics.noData}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {platformStats.map((platform) => (
                  <div key={platform.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-300 capitalize">{platform.name}</span>
                      <span className="text-zinc-400">{platform.percentage}% ({platform.count})</span>
                    </div>
                    <Progress 
                      value={platform.percentage} 
                      className={`h-2 ${platform.color}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users Summary */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">{t.admin.analytics.stats.totalUsers}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t.admin.analytics.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t.admin.analytics.stats.totalUsers}</p>
                <p className="text-xl font-bold text-white">{stats.users.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t.admin.analytics.stats.activeUsersToday}</p>
                <p className="text-xl font-bold text-white">{stats.users.activeToday}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t.admin.analytics.stats.activeUsersToday}</p>
                <p className="text-xl font-bold text-white">
                  {stats.users.total > 0 
                    ? Math.round((stats.users.activeToday / stats.users.total) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
