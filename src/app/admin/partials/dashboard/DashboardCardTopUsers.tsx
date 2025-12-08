
'use client';

import React, { useState, useEffect } from 'react';

interface TopUser {
  username: string;
  download_count: number;
}

const DashboardCardTopUsers = () => {
  const [users, setUsers] = useState<TopUser[]>([]);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const response = await fetch('/api/admin/stats/top-users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch top users:', error);
      }
    };

    fetchTopUsers();
  }, []);

  return (
    <div className="col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Top Users</h2>
      </header>
      <div className="p-3">
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300">
            <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs">
              <tr>
                <th className="p-2">
                  <div className="font-semibold text-left">Username</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Downloads</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-700/60">
              {users.map(user => (
                <tr key={user.username}>
                  <td className="p-2">
                    <div className="text-left">{user.username}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">{user.download_count}</div>
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

export default DashboardCardTopUsers;
