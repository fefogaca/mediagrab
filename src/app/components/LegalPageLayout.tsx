
import React from 'react';
import Link from 'next/link';
import StandardLayout from './StandardLayout';

const LegalPageLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <StandardLayout>
    <div className="bg-white dark:bg-gray-900 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">← Back to Home</Link>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">{title}</h1>
          <div className="mt-8 prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  </StandardLayout>
);

export default LegalPageLayout;
