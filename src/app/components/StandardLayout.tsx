
import React from 'react';
import Link from 'next/link';

const MountainIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const StandardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b dark:border-gray-800">
        <Link href="/" className="flex items-center justify-center">
          <MountainIcon className="h-6 w-6 text-violet-500" />
          <span className="sr-only">MediaGrab</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/pricing" className="text-sm font-medium hover:underline underline-offset-4 dark:text-gray-300">Pricing</Link>
          <Link href="/docs" className="text-sm font-medium hover:underline underline-offset-4 dark:text-gray-300">Docs</Link>
          <Link href="/contact" className="text-sm font-medium hover:underline underline-offset-4 dark:text-gray-300">Contact</Link>
        </nav>
      </header>
      
      <main className="flex-1">{children}</main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 MediaGrab. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4">Terms of Service</Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
};

export default StandardLayout;
