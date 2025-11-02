
'use client';

import React, { useState, useEffect } from 'react';

const MyStatsCard = () => {
  const [stats, setStats] = useState({ totalDownloads: 0, totalApiKeys: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard/my-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col col-span-1 bg-white dark:bg-gray-800 shadow-xs rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Total Downloads</h2>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.totalDownloads}</div>
        </div>
        <div className="flex flex-col col-span-1 bg-white dark:bg-gray-800 shadow-xs rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Total API Keys</h2>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.totalApiKeys}</div>
        </div>
    </div>
  );
};

export default MyStatsCard;
