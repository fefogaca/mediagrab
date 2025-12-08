'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { Badge } from '@frontend/components/ui/badge';
import { Download, Youtube, Instagram, Music, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface RecentDownload {
  id: string;
  url: string;
  platform: string;
  username?: string;
  createdAt: string;
}

export default function DashboardCardRecentDownloads() {
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState<RecentDownload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const response = await fetch('/api/admin/stats/recent-downloads');
        if (response.ok) {
          const data = await response.json();
          setDownloads(data.downloads?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to fetch recent downloads:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDownloads();
  }, []);

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
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  return (
    <Card className="col-span-12 lg:col-span-6 bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Download className="h-5 w-5 text-emerald-500" />
          {t.admin.dashboard.recentDownloads}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        ) : downloads.length === 0 ? (
          <div className="text-center py-8">
            <Download className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500">{t.admin.dashboard.noRecentDownloads}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((download) => (
              <div
                key={download.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getPlatformIcon(download.platform)}
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate max-w-[200px]">
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
