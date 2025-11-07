'use client';
import React, { useState, useEffect } from 'react';

interface DownloadLog {
  id: number;
  url: string;
  downloaded_at: string;
}

const DashboardCardMyDownloads = () => {
  const [recentDownloads, setRecentDownloads] = useState<DownloadLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentDownloads = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Criar endpoint para downloads recentes do usuário
        const response = await fetch('/api/dashboard/my-recent-downloads', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRecentDownloads(data);
        }
      } catch (error) {
        console.error('Failed to fetch recent downloads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDownloads();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Downloads Recentes</h2>
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ) : recentDownloads.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">Nenhum download registrado ainda.</p>
      ) : (
        <div className="space-y-3">
          {recentDownloads.slice(0, 10).map((download) => (
            <div key={download.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{download.url}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(download.downloaded_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardCardMyDownloads;

