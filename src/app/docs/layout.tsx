'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const MountainIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const DocsSidebar = ({ isOpen, setOpen }: { isOpen: boolean, setOpen: (isOpen: boolean) => void }) => {
  const navItems = [
    { title: 'Introduction', href: '/docs' },
    { title: 'Authentication', href: '/docs/authentication' },
    { title: 'API Reference', items: [
      { title: 'Get Video Info', href: '/docs/api/get-video-info' },
    ]},
  ];

  return (
    <aside className={`absolute left-0 top-0 z-40 w-64 h-screen transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex-shrink-0 border-r dark:border-gray-800 bg-white dark:bg-gray-900`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Documentation</h2>
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.title} className="mb-4">
                <a href={item.href || '#'} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium" onClick={() => setOpen(false)}>{item.title}</a>
                {item.items && (
                  <ul className="pl-4 mt-2 border-l dark:border-gray-700">
                    {item.items.map((subItem) => (
                      <li key={subItem.title} className="mt-2">
                        <a href={subItem.href} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" onClick={() => setOpen(false)}>{subItem.title}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b dark:border-gray-800 sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden mr-4">
          <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
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

      <div className="flex flex-1">
        <div className={`fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
        <DocsSidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          {children}
        </main>
      </div>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 MediaGrab. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4">Terms of Service</Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
