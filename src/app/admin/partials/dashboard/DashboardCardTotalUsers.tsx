
'use client';

import React, { useState, useEffect } from 'react';

const DashboardCardTotalUsers = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/admin/stats/total-users');
        const data = await response.json();
        setCount(data.count);
      } catch (error) {
        console.error('Failed to fetch total users:', error);
      }
    };

    fetchCount();
  }, []);

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Total Users</h2>
      <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{count}</div>
    </div>
  );
};

export default DashboardCardTotalUsers;
