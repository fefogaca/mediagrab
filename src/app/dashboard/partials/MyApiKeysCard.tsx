
'use client';

import React, { useState, useEffect } from 'react';

interface ApiKey {
  id: number;
  key: string;
  created_at: string;
  expires_at: string | null;
}

const MyApiKeysCard = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard/my-api-keys', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setApiKeys(data);
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      }
    };

    fetchApiKeys();
  }, []);

  return (
    <div className="col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl mt-6">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">My API Keys</h2>
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
                  <div className="font-semibold text-center">Created At</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Expires At</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-700/60">
              {apiKeys.map(apiKey => (
                <tr key={apiKey.id}>
                  <td className="p-2">
                    <div className="text-left">{apiKey.key}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">{new Date(apiKey.created_at).toLocaleString()}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">{apiKey.expires_at ? new Date(apiKey.expires_at).toLocaleString() : 'Never'}</div>
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

export default MyApiKeysCard;
