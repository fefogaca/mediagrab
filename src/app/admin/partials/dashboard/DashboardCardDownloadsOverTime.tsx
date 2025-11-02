
'use client';

import React, { useState, useEffect } from 'react';
import LineChart from '../../charts/LineChart01';
import { ChartData } from 'chart.js';
import { getCssVariable, adjustColorOpacity } from '../../utils/Utils';
import { chartAreaGradient } from '../../charts/ChartjsConfig';

interface DownloadsOverTimeData {
  date: string;
  count: number;
}

const DashboardCardDownloadsOverTime = () => {
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/admin/stats/downloads-over-time');
        const data: DownloadsOverTimeData[] = await response.json();

        const labels = data.map(item => item.date);
        const counts = data.map(item => item.count);

        const newChartData: ChartData<'line'> = {
          labels: labels,
          datasets: [
            {
              data: counts,
              fill: true,
              backgroundColor: (context) => {
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                const violet500 = getCssVariable('--color-violet-500');
                if (!violet500) return 'transparent';
                return chartAreaGradient(ctx, chartArea, [
                  { stop: 0, color: adjustColorOpacity(violet500, 0) },
                  { stop: 1, color: adjustColorOpacity(violet500, 0.2) }
                ]);
              },            
              borderColor: getCssVariable('--color-violet-500'),
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 3,
              pointBackgroundColor: getCssVariable('--color-violet-500'),
              pointHoverBackgroundColor: getCssVariable('--color-violet-500'),
              pointBorderWidth: 0,
              pointHoverBorderWidth: 0,
              clip: 20,
              tension: 0.2,
            },
          ],
        };

        setChartData(newChartData);

      } catch (error) {
        console.error('Failed to fetch downloads over time:', error);
      }
    };

    fetchChartData();
  }, []);

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Downloads Over Time</h2>
      </header>
      <div className="grow max-sm:max-h-[128px] xl:max-h-[128px]">
        <LineChart data={chartData} width={389} height={128} />
      </div>
    </div>
  );
};

export default DashboardCardDownloadsOverTime;
