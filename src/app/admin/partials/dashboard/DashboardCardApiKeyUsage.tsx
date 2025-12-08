
'use client';

import React, { useState, useEffect } from 'react';

interface ApiKeyUsage {
  key: string;
  download_count: number;
}

const DashboardCardApiKeyUsage = () => {
  const [keys, setKeys] = useState<ApiKeyUsage[]>([]);

  useEffect(() => {
    const fetchApiKeyUsage = async () => {
      try {
        const response = await fetch('/api/admin/stats/api-key-usage');
        const data = await response.json();
        setKeys(data);
      } catch (error) {
        console.error('Failed to fetch API key usage:', error);
      }
    };

    fetchApiKeyUsage();
  }, []);

  return (
    <div className="col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">API Key Usage</h2>
      </header>
      <div className="p-3">
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300">
            <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs">
              <tr>
                <th className="p-2">
                  <div className="font-semibold text-left">API Key</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Downloads</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-700/60">
              {keys.map(key => (
                <tr key={key.key}>
                  <td className="p-2">
                    <div className="text-left">{key.key}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">{key.download_count}</div>
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

export default DashboardCardApiKeyUsage;
