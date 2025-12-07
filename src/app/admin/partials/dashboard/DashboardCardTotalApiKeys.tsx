'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { useTranslation } from '@/lib/i18n';

export default function DashboardCardTotalApiKeys() {
  const { t } = useTranslation();
  return (
    <Card className="col-span-12 sm:col-span-6 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">{t.admin.dashboard.totalApiKeys}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">0</div>
      </CardContent>
    </Card>
  );
}

