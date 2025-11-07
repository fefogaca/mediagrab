'use client';
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      // Mostrar mensagem de sucesso com credenciais ANTES de limpar o form
      const credentials = `Usuário criado com sucesso!\n\nCredenciais:\nUsername: ${data.username || newUser.username}\nPassword: ${newUser.password}\nRole: ${data.role || newUser.role}\n\nID: ${data.userId}\n\nO usuário pode fazer login em /login`;
      alert(credentials);
      
      setNewUser({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Erro ao criar usuário:', err);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editingUser.username, role: editingUser.role }),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      fetchUsers();
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
              👥 Gerenciamento de Usuários
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400 mt-2">
            User Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Crie, edite e gerencie usuários do sistema
          </p>
        </div>

        {/* Create New User */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Criar Novo Usuário
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input
                type="text"
                id="newUsername"
                className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                id="newPassword"
                className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                id="newRole"
                className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-sky-600 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 hover:scale-105 active:scale-95">
              Criar Usuário
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Usuários Existentes
          </h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full dark:text-gray-300">
              <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs">
                <tr>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">ID</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Username</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-left">Role</div></th>
                  <th className="p-2 whitespace-nowrap"><div className="font-semibold text-center">Actions</div></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="p-2 whitespace-nowrap"><div className="text-left">{user.id}</div></td>
                    <td className="p-2 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          className="form-input w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                          value={editingUser.username}
                          onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        />
                      ) : (
                        <div className="text-left font-medium text-gray-800 dark:text-gray-100">{user.username}</div>
                      )}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <select
                          className="form-select w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'admin' })}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <div className="text-left">{user.role}</div>
                      )}
                    </td>
                    <td className="p-2 whitespace-nowrap text-center">
                      {editingUser?.id === user.id ? (
                        <>
                          <button onClick={handleUpdateUser} className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all mr-2">Salvar</button>
                          <button onClick={() => setEditingUser(null)} className="px-3 py-1.5 text-xs font-semibold bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 rounded-lg transition-all">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingUser(user)} className="px-3 py-1.5 text-xs font-semibold bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-all mr-2">Editar</button>
                          <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all">Excluir</button>
                        </>
                      )}
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

export default UsersPage;
