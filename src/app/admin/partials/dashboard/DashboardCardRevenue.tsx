'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@frontend/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function DashboardCardRevenue() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/payments');
        if (response.ok) {
          const data = await response.json();
          setStats({
            total: data.stats?.totalRevenue || 0,
            thisMonth: data.stats?.totalRevenue || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch revenue stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="col-span-12 sm:col-span-6 lg:col-span-3 bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400">{t.admin.dashboard.revenue}</p>
            {loading ? (
              <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-3xl font-bold text-white mt-2">{formatCurrency(stats.total)}</p>
            )}
            {!loading && stats.thisMonth > 0 && (
              <p className="text-sm text-green-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Este mês
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-green-500/10">
            <DollarSign className="h-6 w-6 text-green-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

