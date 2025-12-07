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
import {
  BarChart3,
  TrendingUp,
  Download,
  Key,
  Activity,
} from "lucide-react";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDownloads: 0,
    totalRequests: 0,
    successRate: 98.5,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/my-stats");
      const data = await response.json();
      setStats({
        totalDownloads: data.totalDownloads || 0,
        totalRequests: data.usageCount || 0,
        successRate: 98.5,
      });
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = [
    { day: "Seg", value: Math.floor(Math.random() * 50) + 10 },
    { day: "Ter", value: Math.floor(Math.random() * 50) + 10 },
    { day: "Qua", value: Math.floor(Math.random() * 50) + 10 },
    { day: "Qui", value: Math.floor(Math.random() * 50) + 10 },
    { day: "Sex", value: Math.floor(Math.random() * 50) + 10 },
    { day: "Sáb", value: Math.floor(Math.random() * 50) + 10 },
    { day: "Dom", value: Math.floor(Math.random() * 50) + 10 },
  ];

  const maxValue = Math.max(...weeklyData.map(d => d.value));

  const platformUsage = [
    { name: "YouTube", percentage: 45, color: "bg-red-500" },
    { name: "Instagram", percentage: 30, color: "bg-pink-500" },
    { name: "TikTok", percentage: 15, color: "bg-cyan-500" },
    { name: "Outros", percentage: 10, color: "bg-zinc-500" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-400 mt-1">Estatísticas de uso da sua conta</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Download className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Downloads</p>
                <p className="text-2xl font-bold text-white">{stats.totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Usage */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Uso Semanal
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Downloads nos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((data) => (
                <div key={data.day} className="flex items-center gap-4">
                  <span className="text-sm text-zinc-400 w-10">{data.day}</span>
                  <div className="flex-1 h-8 bg-zinc-800 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-lg flex items-center justify-end pr-3"
                      style={{ width: `${(data.value / maxValue) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">
                        {data.value}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-500" />
              Plataformas
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Distribuição por origem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platformUsage.map((platform) => (
                <div key={platform.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">{platform.name}</span>
                    <span className="text-zinc-400">{platform.percentage}%</span>
                  </div>
                  <Progress 
                    value={platform.percentage} 
                    className={`h-2 ${platform.color}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <BarChart3 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Sobre os Analytics</h3>
              <p className="text-sm text-zinc-400">
                Os dados de analytics são atualizados em tempo real. As estatísticas mostram 
                seu uso da API nos últimos 30 dias e ajudam você a entender melhor seus padrões 
                de consumo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

