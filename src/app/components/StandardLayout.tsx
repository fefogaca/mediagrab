
import React from 'react';
import Link from 'next/link';

const MountainIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const StandardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 px-4 lg:px-6 h-16 flex items-center backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50">
        <Link href="/" className="flex items-center justify-center group">
          <MountainIcon className="h-7 w-7 text-violet-600 dark:text-violet-400 transition-transform group-hover:scale-110" />
          <span className="ml-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-sky-600 dark:from-violet-400 dark:to-sky-400 bg-clip-text text-transparent">MediaGrab</span>
          <span className="sr-only">MediaGrab</span>
        </Link>
        <nav className="ml-auto flex items-center gap-6 sm:gap-8">
          <Link href="/" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors relative group py-2">
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 transition-all group-hover:w-full"></span>
          </Link>
          <Link href="/pricing" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors relative group py-2">
            Pricing
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 transition-all group-hover:w-full"></span>
          </Link>
          <Link href="/docs" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors relative group py-2">
            Docs
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 transition-all group-hover:w-full"></span>
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors relative group py-2">
            Contact
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 transition-all group-hover:w-full"></span>
          </Link>
          <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-sky-600 text-white hover:from-violet-700 hover:to-sky-700 dark:from-violet-500 dark:to-sky-500 dark:hover:from-violet-600 dark:hover:to-sky-600 transition-all shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30">
            Admin
          </Link>
        </nav>
      </header>
      
      <main className="flex-1">{children}</main>

      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center justify-between px-4 md:px-6 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">&copy; 2024 MediaGrab. Todos os direitos reservados.</p>
        <nav className="flex gap-6">
          <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Privacy</Link>
          <a href="https://felipefogaca.net" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Developer</a>
        </nav>
      </footer>
    </div>
  );
};

export default StandardLayout;
