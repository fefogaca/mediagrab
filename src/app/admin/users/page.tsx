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
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      setNewUser({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError((err as Error).message);
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

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <main className="grow">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-4">User Management</h1>

        {/* Create New User */}
        <div className="bg-white dark:bg-gray-800 shadow-xs rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Create New User</h2>
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
            <button type="submit" className="btn bg-violet-500 hover:bg-violet-600 text-white">Add User</button>
          </form>
        </div>

        {/* User List */}
        <div className="bg-white dark:bg-gray-800 shadow-xs rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Existing Users</h2>
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
                          <button onClick={handleUpdateUser} className="btn-xs bg-green-500 hover:bg-green-600 text-white mr-2">Save</button>
                          <button onClick={() => setEditingUser(null)} className="btn-xs bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingUser(user)} className="btn-xs bg-blue-500 hover:bg-blue-600 text-white mr-2">Edit</button>
                          <button onClick={() => handleDeleteUser(user.id)} className="btn-xs bg-red-500 hover:bg-red-600 text-white">Delete</button>
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
