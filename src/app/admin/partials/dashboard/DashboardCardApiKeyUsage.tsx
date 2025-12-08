'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { Progress } from '@frontend/components/ui/progress';
import { Key, Activity } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ApiKeyUsage {
  name: string;
  usage: number;
  limit: number;
}

export default function DashboardCardApiKeyUsage() {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKeyUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await fetch('/api/admin/api-keys');
        if (response.ok) {
          const data = await response.json();
          const keys = (data.apiKeys || []).slice(0, 5).map((key: any) => ({
            name: key.name || 'API Key',
            usage: key.usageCount || 0,
            limit: key.usageLimit || 100,
          }));
          setApiKeys(keys);
        }
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApiKeys();
  }, []);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <Card className="col-span-12 bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Key className="h-5 w-5 text-amber-500" />
          {t.admin.dashboard.apiKeyUsage}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500">Nenhuma API Key encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key, index) => {
              const percentage = Math.min((key.usage / key.limit) * 100, 100);
              return (
                <div key={index} className="p-3 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className={`h-4 w-4 ${percentage >= 90 ? 'text-red-500' : 'text-zinc-400'}`} />
                      <span className="text-sm font-medium text-white">{key.name}</span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {key.usage.toLocaleString()} / {key.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${getUsageColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 text-right">{percentage.toFixed(1)}% usado</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
