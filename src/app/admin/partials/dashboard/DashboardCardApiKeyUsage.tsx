'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { useTranslation } from '@/lib/i18n';

export default function DashboardCardApiKeyUsage() {
  const { t } = useTranslation();
  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">{t.admin.dashboard.apiKeyUsage}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-zinc-400">{t.admin.dashboard.chartComingSoon}</div>
      </CardContent>
    </Card>
  );
}

