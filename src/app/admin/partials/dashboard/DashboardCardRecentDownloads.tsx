
'use client';

import React, { useState, useEffect } from 'react';

interface DownloadLog {
  id: number;
  url: string;
  user_id: number | null;
  api_key_id: number | null;
  created_at: string;
}

const DashboardCardRecentDownloads = () => {
  const [logs, setLogs] = useState<DownloadLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/admin/stats/recent-downloads');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch recent downloads:', error);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Recent Downloads</h2>
      </header>
      <div className="p-3">
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300">
            <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs">
              <tr>
                <th className="p-2">
                  <div className="font-semibold text-left">URL</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">User ID</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">API Key ID</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Created At</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-700/60">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="p-2">
                    <div className="text-left">{log.url}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">{log.user_id}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">{log.api_key_id}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">{new Date(log.created_at).toLocaleString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardCardRecentDownloads;
