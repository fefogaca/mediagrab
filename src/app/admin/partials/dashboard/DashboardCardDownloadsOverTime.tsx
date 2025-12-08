'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface DailyStats {
  date: string;
  count: number;
}

export default function DashboardCardDownloadsOverTime() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats/total-downloads');
        if (response.ok) {
          const data = await response.json();
          setTotal(data.last7Days || 0);
          // Simular dados para os últimos 7 dias
          const days = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push({
              date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
              count: Math.floor(Math.random() * (data.last7Days / 7 || 10)),
            });
          }
          setStats(days);
        }
      } catch (error) {
        console.error('Failed to fetch downloads stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const maxCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <Card className="col-span-12 bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            {t.admin.dashboard.downloadsOverTime}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>{total} nos últimos 7 dias</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-40 flex items-end justify-between gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-1 bg-zinc-800 rounded animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-end justify-between gap-2">
            {stats.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded-t transition-colors relative group"
                  style={{ height: `${Math.max((day.count / maxCount) * 100, 5)}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t transition-all"
                    style={{ height: `${Math.min(day.count / maxCount * 100, 100)}%` }}
                  />
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap transition-opacity">
                    {day.count} downloads
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{day.date}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
