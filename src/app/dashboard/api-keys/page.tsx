'use client';
import React, { useState, useEffect } from 'react';

interface ApiKey {
  id: number;
  key: string;
  created_at: string;
  expires_at: string | null;
  usage_limit: number;
  usage_count: number;
}

const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newApiKeyExpiresAt, setNewApiKeyExpiresAt] = useState<string>('');
  const [selectedUsageLimit, setSelectedUsageLimit] = useState<string>('100');
  const [customUsageLimit, setCustomUsageLimit] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiKeysResponse = await fetch('/api/dashboard/my-api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!apiKeysResponse.ok) throw new Error('Failed to fetch API keys');

      const apiKeysData = await apiKeysResponse.json();
      setApiKeys(apiKeysData);
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
        setError('Por favor, insira uma data de expiração válida.');
        return;
      }
      expiresAtToSend = date.toISOString();
    }

    let limitToSend = parseInt(selectedUsageLimit);
    if (selectedUsageLimit === 'custom') {
      limitToSend = parseInt(customUsageLimit);
      if (isNaN(limitToSend) || limitToSend <= 0) {
        setError('Por favor, insira um limite de uso válido.');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/dashboard/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ usage_limit: limitToSend, expires_at: expiresAtToSend }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create API key');
      }

      const data = await response.json();
      setNewApiKeyExpiresAt('');
      setSelectedUsageLimit('100');
      setCustomUsageLimit('');
      setError(null);
      fetchData();
      
      // Mostrar a nova API key
      if (data.apiKey) {
        setCopiedKey(data.apiKey);
        await navigator.clipboard.writeText(data.apiKey);
        setTimeout(() => setCopiedKey(null), 5000);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteApiKey = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta API key?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/dashboard/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <main className="grow bg-gradient-to-br from-gray-50 via-white to-violet-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <div className="inline-block mb-3">
              <span className="px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200 dark:border-violet-800">
                🔑 Gerenciamento de API Keys
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400 mt-2">
              Minhas API Keys
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm md:text-base">
              Gerencie suas chaves de API e monitore seu uso
            </p>
          </div>
        </div>

        {/* Create API Key Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-xl mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Gerar Nova API Key
          </h2>
          <form onSubmit={handleCreateApiKey} className="space-y-4">
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Expiração (Opcional)
              </label>
              <input
                type="datetime-local"
                id="expiresAt"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                value={newApiKeyExpiresAt}
                onChange={(e) => setNewApiKeyExpiresAt(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Limite de Uso
              </label>
              <select
                id="usageLimit"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                value={selectedUsageLimit}
                onChange={(e) => setSelectedUsageLimit(e.target.value)}
              >
                <option value="100">100 chamadas/mês (Developer)</option>
                <option value="10000">10,000 chamadas/mês (Pro)</option>
                <option value="100000">100,000 chamadas/mês (Business)</option>
                <option value="custom">Personalizado</option>
              </select>
              {selectedUsageLimit === 'custom' && (
                <input
                  type="number"
                  className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Digite o limite personalizado"
                  value={customUsageLimit}
                  onChange={(e) => setCustomUsageLimit(e.target.value)}
                  min="1"
                />
              )}
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-sky-600 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Gerar API Key
            </button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
              <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
            </div>
          )}
          {copiedKey && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Nova API Key criada e copiada!</p>
              <button
                onClick={() => handleCopyKey(copiedKey)}
                className="w-full text-left text-base font-mono text-emerald-900 dark:text-emerald-100 break-all bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                {copiedKey}
              </button>
            </div>
          )}
        </div>

        {/* API Key List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Suas API Keys
          </h2>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : apiKeys.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Você ainda não possui API keys. Crie uma acima.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">API Key</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Criada</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Expira</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Uso</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {apiKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCopyKey(apiKey.key)}
                          className="text-sm font-mono text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 break-all text-left flex items-center gap-2"
                        >
                          {apiKey.key}
                          {copiedKey === apiKey.key ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(apiKey.created_at)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(apiKey.expires_at)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {apiKey.usage_count} / {apiKey.usage_limit}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ApiKeysPage;

