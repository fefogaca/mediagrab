
'use client';

import React from 'react';
import MyApiKeysCard from './partials/MyApiKeysCard';
import MyStatsCard from './partials/MyStatsCard';

function Dashboard() {
  return (
    <main className="grow">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-8">User Dashboard</h1>
        <div className="grid grid-cols-12 gap-6">
          <MyStatsCard />
          <MyApiKeysCard />
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
