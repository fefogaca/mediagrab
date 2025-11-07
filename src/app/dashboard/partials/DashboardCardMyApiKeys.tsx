'use client';
import React, { useState, useEffect } from 'react';

interface ApiKey {
  id: number;
  key: string;
  created_at: string;
  expires_at: string | null;
  usage_count: number;
  usage_limit: number;
}

const DashboardCardMyApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/dashboard/my-api-keys', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setApiKeys(data);
        }
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Suas API Keys</h2>
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ) : apiKeys.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">Você ainda não possui API keys. Crie uma na página de API Keys.</p>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">{apiKey.key}</code>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div>
                  <span className="font-semibold">Criada:</span> {formatDate(apiKey.created_at)}
                </div>
                <div>
                  <span className="font-semibold">Expira:</span> {formatDate(apiKey.expires_at)}
                </div>
                <div>
                  <span className="font-semibold">Uso:</span> {apiKey.usage_count} / {apiKey.usage_limit}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={`px-2 py-1 rounded text-xs ${
                    apiKey.usage_count >= apiKey.usage_limit
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : apiKey.expires_at && new Date(apiKey.expires_at) < new Date()
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  }`}>
                    {apiKey.usage_count >= apiKey.usage_limit
                      ? 'Limite Atingido'
                      : apiKey.expires_at && new Date(apiKey.expires_at) < new Date()
                        ? 'Expirada'
                        : 'Ativa'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardCardMyApiKeys;

