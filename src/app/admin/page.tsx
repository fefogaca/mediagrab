
'use client';
import React from 'react';
import DashboardCardTotalDownloads from './partials/dashboard/DashboardCardTotalDownloads';
import DashboardCardTotalUsers from './partials/dashboard/DashboardCardTotalUsers';
import DashboardCardTotalApiKeys from './partials/dashboard/DashboardCardTotalApiKeys';
import DashboardCardRecentDownloads from './partials/dashboard/DashboardCardRecentDownloads';
import DashboardCardTopUsers from './partials/dashboard/DashboardCardTopUsers';
import dynamic from 'next/dynamic';

const DynamicDashboardCardDownloadsOverTime = dynamic(() => import('./partials/dashboard/DashboardCardDownloadsOverTime'), { ssr: false });
const DynamicDashboardCardApiKeyUsage = dynamic(() => import('./partials/dashboard/DashboardCardApiKeyUsage'), { ssr: false });

function Dashboard() {
  const isBrowser = typeof window !== 'undefined';

  return (
    <main className="grow">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Dashboard</h1>
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
