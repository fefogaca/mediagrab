"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";
import { Progress } from "@frontend/components/ui/progress";
import {
  Key,
  Download,
  Activity,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Stats {
  totalKeys: number;
  totalDownloads: number;
  usageCount: number;
  usageLimit: number;
}

interface RecentDownload {
  id: string;
  url: string;
  downloaded_at: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    totalKeys: 0,
    totalDownloads: 0,
    usageCount: 0,
    usageLimit: 5, // Limite gratuito: 5 requests
  });
  const [recentDownloads, setRecentDownloads] = useState<RecentDownload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, downloadsRes] = await Promise.all([
        fetch("/api/dashboard/my-stats"),
        fetch("/api/dashboard/my-recent-downloads"),
      ]);

      // Verificar se as respostas são válidas
      if (!statsRes.ok) {
        console.error("Erro ao buscar stats:", statsRes.status, statsRes.statusText);
      }
      if (!downloadsRes.ok) {
        console.error("Erro ao buscar downloads:", downloadsRes.status, downloadsRes.statusText);
      }

      const statsData = await statsRes.json().catch((err) => {
        console.error("Erro ao parsear stats:", err);
        return { totalKeys: 0, totalDownloads: 0, usageCount: 0, usageLimit: 5 };
      });
      
      const downloadsData = await downloadsRes.json().catch((err) => {
        console.error("Erro ao parsear downloads:", err);
        return { downloads: [] };
      });

      setStats({
        totalKeys: statsData.totalApiKeys || statsData.totalKeys || 0,
        totalDownloads: statsData.totalDownloads || 0,
        usageCount: statsData.usageCount || 0,
        usageLimit: statsData.usageLimit || 5,
      });
      setRecentDownloads(downloadsData.downloads?.slice(0, 5) || []);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      // Garantir valores padrão em caso de erro
      setStats({
        totalKeys: 0,
        totalDownloads: 0,
        usageCount: 0,
        usageLimit: 5,
      });
      setRecentDownloads([]);
    } finally {
      setLoading(false);
    }
  };

  const usagePercentage = Math.min((stats.usageCount / stats.usageLimit) * 100, 100);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t.dashboard.title}</h1>
        <p className="text-zinc-400 mt-1">{t.dashboard.welcome}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Key className="h-5 w-5 text-emerald-500" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                {t.apiKeys.status.active}
              </Badge>
            </div>
            <p className="text-sm text-zinc-400">{t.dashboard.stats.apiKeysActive}</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalKeys}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Download className="h-5 w-5 text-blue-500" />
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-sm text-zinc-400">{t.dashboard.stats.totalDownloads}</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalDownloads}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-xs text-zinc-500">
                {stats.usageCount}/{stats.usageLimit}
              </span>
            </div>
            <p className="text-sm text-zinc-400">{t.dashboard.usage}</p>
            <div className="mt-2">
              <Progress 
                value={usagePercentage} 
                className={`h-2 ${usagePercentage >= 80 ? 'bg-amber-500' : ''}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">{t.dashboard.quickActions}</CardTitle>
            <CardDescription className="text-zinc-400">
              {t.dashboard.overview}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/dashboard/api-keys" className="block">
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                    <Key className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{t.dashboard.actions.createApiKey}</p>
                    <p className="text-xs text-zinc-500">{t.apiKeys.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/" className="block">
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Download className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{t.dashboard.downloads}</p>
                    <p className="text-xs text-zinc-500">{t.landing.title}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/dashboard/subscription" className="block">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-emerald-500/20">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{t.dashboard.actions.upgradePlan}</p>
                    <p className="text-xs text-emerald-400/80">{t.dashboard.upgrade}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Downloads */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">{t.dashboard.recentDownloads}</CardTitle>
              <CardDescription className="text-zinc-400">
                {t.dashboard.downloads}
              </CardDescription>
            </div>
            <Link href="/dashboard/downloads">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                {t.common.viewAll}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentDownloads.length === 0 ? (
              <div className="text-center py-8">
                <Download className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">{t.dashboard.noDownloads}</p>
                <Link href="/">
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-500">
                    {t.dashboard.downloads}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDownloads.map((download) => (
                  <div
                    key={download.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Download className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{download.url}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(download.downloaded_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Info */}
      <Card className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-800/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{t.dashboard.actions.upgradePlan}</h3>
              <p className="text-zinc-400 mt-1">
                {t.dashboard.upgradeDescription}
              </p>
            </div>
            <Link href="/dashboard/subscription">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Zap className="h-4 w-4 mr-2" />
                {t.dashboard.viewPlans}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
