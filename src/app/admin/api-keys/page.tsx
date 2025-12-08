'use client';
import React, { useState, useEffect } from 'react';

interface ApiKey {
  id: number;
  key: string;
  user_id: number;
  created_at: string;
  expires_at: string | null;
  usage_limit: number;
  usage_count: number;
  username?: string;
  role?: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}

const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newApiKeyExpiresAt, setNewApiKeyExpiresAt] = useState<string>('');
  const [selectedUsageLimit, setSelectedUsageLimit] = useState<string>('100'); // Default to 100
  const [customUsageLimit, setCustomUsageLimit] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apiKeysResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/api-keys'),
        fetch('/api/admin/users')
      ]);

      if (!apiKeysResponse.ok) throw new Error('Failed to fetch API keys');
      if (!usersResponse.ok) throw new Error('Failed to fetch users');

      const apiKeysData = await apiKeysResponse.json();
      const usersData = await usersResponse.json();

      setApiKeys(apiKeysData);
      setUsers(usersData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    let expiresAtToSend: string | null = null;
    if (newApiKeyExpiresAt) {
      const date = new Date(newApiKeyExpiresAt);
      if (isNaN(date.getTime())) {
        setError('Please enter a valid expiration date.');
        return;
      }
      expiresAtToSend = date.toISOString();
    }

    let limitToSend = parseInt(selectedUsageLimit);
    if (selectedUsageLimit === 'custom') {
      limitToSend = parseInt(customUsageLimit);
      if (isNaN(limitToSend) || limitToSend <= 0) {
        setError('Please enter a valid custom usage limit.');
        return;
      }
    }

    try {
      if (!selectedUserId) {
        setError('Por favor, selecione um usuário.');
        return;
      }

      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(selectedUserId), usage_limit: limitToSend, expires_at: expiresAtToSend }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create API key');
      }
      
      setNewApiKeyExpiresAt('');
      setSelectedUsageLimit('100');
      setCustomUsageLimit('');
      setSelectedUserId('');
      setError(null);
      fetchData();
      
      alert(`API Key criada com sucesso para o usuário! Key: ${data.apiKey}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteApiKey = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }
      fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <main className="grow bg-gradient-to-br from-gray-50 via-white to-violet-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grow bg-gradient-to-br from-gray-50 via-white to-violet-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
            <p className="text-rose-600 dark:text-rose-400">Erro: {error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grow bg-gradient-to-br from-gray-50 via-white to-violet-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="mb-8">
          <div className="inline-block mb-3">
            <span className="px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200 dark:border-violet-800">
              🔑 Gerenciamento de API Keys
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400 mt-2">
            API Key Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Gere e gerencie chaves de API para acesso à plataforma
          </p>
        </div>

        {/* Create New API Key */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Gerar Nova API Key
          </h2>
          <form onSubmit={handleCreateApiKey} className="space-y-4">
            <div>
              <label htmlFor="selectedUserId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
              <select
                id="selectedUserId"
                className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">Selecione um usuário</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="newApiKeyExpiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Expiração (Opcional)</label>
              <input
                id="newApiKeyExpiresAt"
                type="datetime-local"
                className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={newApiKeyExpiresAt}
                onChange={(e) => setNewApiKeyExpiresAt(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usage Limit</label>
              <select
                id="usageLimit"
                className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={selectedUsageLimit}
                onChange={(e) => setSelectedUsageLimit(e.target.value)}
              >
                <option value="100">100 calls/month (Developer)</option>
                <option value="10000">10,000 calls/month (Pro)</option>
                <option value="100000">100,000 calls/month (Business)</option>
                <option value="custom">Custom</option>
              </select>
              {selectedUsageLimit === 'custom' && (
                <input
                  type="number"
                  className="form-input mt-2 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  placeholder="Enter custom limit"
                  value={customUsageLimit}
                  onChange={(e) => setCustomUsageLimit(e.target.value)}
                  min="1"
                />
              )}
            </div>
            <button type="submit" className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-sky-600 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 hover:scale-105 active:scale-95">
              Gerar API Key
            </button>
          </form>
        </div>

        {/* API Key List */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            API Keys Existentes
          </h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full dark:text-gray-300">
              <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs">
                <tr>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">ID</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Key</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Usuário</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Limit</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Usage</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Created At</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Expires At</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-center">Actions</div></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id}>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{apiKey.id}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left font-medium text-gray-800 dark:text-gray-100 font-mono text-xs">{apiKey.key}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{apiKey.username || `User #${apiKey.user_id}`} {apiKey.role && `(${apiKey.role})`}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{apiKey.usage_limit}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{apiKey.usage_count || 0}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{new Date(apiKey.created_at).toLocaleDateString('pt-BR')}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{apiKey.expires_at ? new Date(apiKey.expires_at).toLocaleDateString('pt-BR') : 'Nunca'}</div></td>
                    <td className="p-2 whitespace-nowrap text-center">
                      <button onClick={() => handleDeleteApiKey(apiKey.id)} className="px-3 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ApiKeysPage;
