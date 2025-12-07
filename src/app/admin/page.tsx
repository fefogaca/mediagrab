
'use client';
import React from 'react';
import DashboardCardTotalDownloads from './partials/dashboard/DashboardCardTotalDownloads';
import DashboardCardTotalUsers from './partials/dashboard/DashboardCardTotalUsers';
import DashboardCardTotalApiKeys from './partials/dashboard/DashboardCardTotalApiKeys';
import DashboardCardRecentDownloads from './partials/dashboard/DashboardCardRecentDownloads';
import DashboardCardTopUsers from './partials/dashboard/DashboardCardTopUsers';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';

const DynamicDashboardCardDownloadsOverTime = dynamic(() => import('./partials/dashboard/DashboardCardDownloadsOverTime'), { ssr: false });
const DynamicDashboardCardApiKeyUsage = dynamic(() => import('./partials/dashboard/DashboardCardApiKeyUsage'), { ssr: false });

function Dashboard() {
  const isBrowser = typeof window !== 'undefined';
  const { t } = useTranslation();

  return (
    <main className="grow">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">{t.admin.dashboard.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t.admin.dashboard.welcome}</p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <DashboardCardTotalDownloads />
          <DashboardCardTotalUsers />
          <DashboardCardTotalApiKeys />
          <DashboardCardRecentDownloads />
          {isBrowser && <DynamicDashboardCardDownloadsOverTime />}
          <DashboardCardTopUsers />
          {isBrowser && <DynamicDashboardCardApiKeyUsage />}
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
