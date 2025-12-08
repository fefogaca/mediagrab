'use client';
import React, { useState, useEffect } from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  target_user_id: number | null;
  created_at: string;
  created_by_username?: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    target_audience: 'all',
    target_user_id: '',
  });

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

      const [notificationsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/admin/users')
      ]);

      if (!notificationsResponse.ok) throw new Error('Failed to fetch notifications');
      if (!usersResponse.ok) throw new Error('Failed to fetch users');

      const notificationsData = await notificationsResponse.json();
      const usersData = await usersResponse.json();

      setNotifications(notificationsData);
      setUsers(usersData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const payload: any = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        target_audience: newNotification.target_audience,
      };

      if (newNotification.target_audience === 'user' && newNotification.target_user_id) {
        payload.target_user_id = parseInt(newNotification.target_user_id);
      }

      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create notification');
      }

      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        target_audience: 'all',
        target_user_id: '',
      });
      fetchData();
      alert('Notificação criada com sucesso!');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta notificação?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'error':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
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

  return (
    <main className="grow bg-gradient-to-br from-gray-50 via-white to-violet-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="mb-8">
          <div className="inline-block mb-3">
            <span className="px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200 dark:border-violet-800">
              📢 Gerenciamento de Notificações
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400 mt-2">
            Notificações
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Crie e gerencie notificações para usuários
          </p>
        </div>

        {/* Create Notification Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Criar Nova Notificação
          </h2>
          <form onSubmit={handleCreateNotification} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
              <input
                type="text"
                id="title"
                className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem</label>
              <textarea
                id="message"
                rows={4}
                className="form-textarea mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                <select
                  id="type"
                  className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                >
                  <option value="info">Info</option>
                  <option value="success">Sucesso</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                </select>
              </div>
              <div>
                <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Público-alvo</label>
                <select
                  id="target_audience"
                  className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  value={newNotification.target_audience}
                  onChange={(e) => setNewNotification({ ...newNotification, target_audience: e.target.value, target_user_id: '' })}
                >
                  <option value="all">Todos os usuários</option>
                  <option value="user">Usuário específico</option>
                </select>
              </div>
            </div>
            {newNotification.target_audience === 'user' && (
              <div>
                <label htmlFor="target_user_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
                <select
                  id="target_user_id"
                  className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  value={newNotification.target_user_id}
                  onChange={(e) => setNewNotification({ ...newNotification, target_user_id: e.target.value })}
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
            )}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
                <p className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-sky-600 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Criar Notificação
            </button>
          </form>
        </div>

        {/* Notifications List */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Notificações Existentes
          </h2>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Nenhuma notificação criada ainda.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{notification.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Público: {notification.target_audience === 'all' ? 'Todos' : `Usuário #${notification.target_user_id}`}</span>
                        <span>Criado: {formatDate(notification.created_at)}</span>
                        {notification.created_by_username && (
                          <span>Por: {notification.created_by_username}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotificationsPage;

