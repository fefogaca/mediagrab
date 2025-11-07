'use client';
import React, { useState, useEffect } from 'react';
import DashboardCardMyStats from './partials/DashboardCardMyStats';
import DashboardCardMyApiKeys from './partials/DashboardCardMyApiKeys';
import DashboardCardMyDownloads from './partials/DashboardCardMyDownloads';
import dynamic from 'next/dynamic';

const DynamicDashboardCardDownloadsOverTime = dynamic(() => import('./partials/DashboardCardDownloadsOverTime'), { ssr: false });

function Dashboard() {
  const isBrowser = typeof window !== 'undefined';

  return (
    <main className="grow bg-gradient-to-br from-gray-50 via-white to-violet-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <div className="inline-block mb-3">
              <span className="px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200 dark:border-violet-800">
                📊 Minhas Métricas
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400 mt-2">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm md:text-base">
              Visualize suas métricas pessoais e estatísticas de uso da API
            </p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <DashboardCardMyStats />
          <DashboardCardMyApiKeys />
          <DashboardCardMyDownloads />
          {isBrowser && <DynamicDashboardCardDownloadsOverTime />}
        </div>
      </div>
    </main>
  );
}

export default Dashboard;

