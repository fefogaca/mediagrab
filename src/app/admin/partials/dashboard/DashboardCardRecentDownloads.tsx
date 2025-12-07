'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { useTranslation } from '@/lib/i18n';

export default function DashboardCardRecentDownloads() {
  const { t } = useTranslation();
  return (
    <Card className="col-span-12 lg:col-span-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">{t.admin.dashboard.recentDownloads}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-zinc-400">{t.admin.dashboard.noRecentDownloads}</div>
      </CardContent>
    </Card>
  );
}

