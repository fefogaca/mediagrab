
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* TODO: Add a sidebar for the user dashboard */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
