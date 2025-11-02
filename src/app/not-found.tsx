'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center px-4">
      <div className="max-w-md">
        <div className="relative w-64 h-48 mx-auto mb-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-bold text-gray-200 dark:text-gray-700 opacity-60 animate-pulse">
            404
          </div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
             <svg className="w-24 h-24 text-violet-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Page Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 text-sm font-medium text-white bg-violet-600 rounded-md shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
