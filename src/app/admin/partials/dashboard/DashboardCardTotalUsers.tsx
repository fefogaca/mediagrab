'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@frontend/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function DashboardCardTotalUsers() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ total: 0, activeToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats/total-users');
        if (response.ok) {
          const data = await response.json();
          setStats({ total: data.total || 0, activeToday: data.activeToday || 0 });
        }
      } catch (error) {
        console.error('Failed to fetch users stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Card className="col-span-12 sm:col-span-6 lg:col-span-3 bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400">{t.admin.dashboard.totalUsers}</p>
            {loading ? (
              <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-3xl font-bold text-white mt-2">{stats.total.toLocaleString()}</p>
            )}
            {!loading && stats.activeToday > 0 && (
              <p className="text-sm text-blue-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.activeToday} ativos hoje
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
