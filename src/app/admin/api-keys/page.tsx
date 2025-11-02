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
}

interface User {
  id: number;
  username: string;
}

const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newApiKeyUserId, setNewApiKeyUserId] = useState<string>('');
  const [selectedUsageLimit, setSelectedUsageLimit] = useState<string>('100'); // Default to 100
  const [customUsageLimit, setCustomUsageLimit] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apiKeysResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/api-keys'),
        fetch('/api/admin/users'),
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
    if (!newApiKeyUserId) {
      setError('Please select a user for the new API key.');
      return;
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
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(newApiKeyUserId), usage_limit: limitToSend }),
      });
      if (!response.ok) {
        throw new Error('Failed to create API key');
      }
      setNewApiKeyUserId('');
      setSelectedUsageLimit('100');
      setCustomUsageLimit('');
      fetchData();
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

  if (loading) return <p>Loading API keys...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <main className="grow">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-4">API Key Management</h1>

        {/* Create New API Key */}
        <div className="bg-white dark:bg-gray-800 shadow-xs rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Generate New API Key</h2>
          <form onSubmit={handleCreateApiKey} className="space-y-4">
            <div>
              <label htmlFor="newApiKeyUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign to User</label>
              <select
                id="newApiKeyUser"
                className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={newApiKeyUserId}
                onChange={(e) => setNewApiKeyUserId(e.target.value)}
                required
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
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
            <button type="submit" className="btn bg-violet-500 hover:bg-violet-600 text-white">Generate API Key</button>
          </form>
        </div>

        {/* API Key List */}
        <div className="bg-white dark:bg-gray-800 shadow-xs rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Existing API Keys</h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full dark:text-gray-300">
              <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs">
                <tr>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">ID</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Key</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">User</div></th>
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
                    <td className="p-2 whitespace-nowrap"><div className="text-left font-medium text-gray-800 dark:text-gray-100">{apiKey.key}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{users.find(user => user.id === apiKey.user_id)?.username || 'N/A'}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{apiKey.usage_limit}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{apiKey.usage_count}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{new Date(apiKey.created_at).toLocaleDateString()}</div></td>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{apiKey.expires_at ? new Date(apiKey.expires_at).toLocaleDateString() : 'Never'}</div></td>
                    <td className="p-2 whitespace-nowrap text-center">
                      <button onClick={() => handleDeleteApiKey(apiKey.id)} className="btn-xs bg-red-500 hover:bg-red-600 text-white">Delete</button>
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
