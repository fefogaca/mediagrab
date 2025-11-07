'use client';
import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import SidebarLinkGroup from "../../admin/partials/SidebarLinkGroup";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  variant?: 'default' | 'v2';
}

const MountainIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const Sidebar = ({ sidebarOpen, setSidebarOpen, variant = 'default' }: SidebarProps) => {
  const pathname = usePathname();

  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
    return storedSidebarExpanded !== null && storedSidebarExpanded === "true";
  });

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node) || trigger.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.body.classList.add("sidebar-expanded");
    } else {
      document.body.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <div className="min-w-fit">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex lg:flex! flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:w-64! shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-64"} ${variant === 'v2' ? 'border-r border-gray-200 dark:border-gray-700/60' : 'rounded-r-2xl shadow-xs'}`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          {/* Close button */}
          <button
            ref={trigger}
            className="lg:hidden text-gray-500 hover:text-gray-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <Link href="/dashboard" className="block">
            <MountainIcon className="fill-violet-500" width={32} height={32} />
          </Link>
        </div>

        {/* Links */}
        <div className="space-y-8">
          {/* Pages group */}
          <div>
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
              <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6" aria-hidden="true">
                •••
              </span>
              <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">Pages</span>
            </h3>
            <ul className="mt-3">
              {/* Dashboard */}
              <li className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${pathname === '/dashboard' && 'bg-gray-200 dark:bg-gray-700'}`}>
                <Link
                  href="/dashboard"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === '/dashboard' ? 'hover:text-gray-800 dark:hover:text-gray-100' : 'hover:text-gray-800 dark:hover:text-gray-100'}`}>
                  <div className="flex items-center">
                    <svg className="shrink-0 h-6 w-6" viewBox="0 0 24 24">
                      <path
                        className={`fill-current ${pathname === '/dashboard' ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`}
                        d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0z"
                      />
                      <path
                        className={`fill-current ${pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-600'}`}
                        d="M12 3c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9z"
                      />
                      <path
                        className={`fill-current ${pathname === '/dashboard' ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-400'}`}
                        d="M12 15c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3z"
                      />
                    </svg>
                    <span className="text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 text-gray-800 dark:text-gray-100">
                      Dashboard
                    </span>
                  </div>
                </Link>
              </li>
              {/* Home */}
              <li className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${pathname === '/' && 'bg-gray-200 dark:bg-gray-700'}`}>
                <Link
                  href="/"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === '/' ? 'hover:text-gray-800 dark:hover:text-gray-100' : 'hover:text-gray-800 dark:hover:text-gray-100'}`}>
                  <div className="flex items-center">
                    <svg className="shrink-0 h-6 w-6" viewBox="0 0 24 24">
                      <path
                        className={`fill-current ${pathname === '/' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`}
                        d="M12 2.25L1 12h3v8h6v-6h4v6h6v-8h3L12 2.25z"
                      />
                    </svg>
                    <span className="text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 text-gray-800 dark:text-gray-100">
                      Home
                    </span>
                  </div>
                </Link>
              </li>
              {/* API Keys */}
              <li className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${pathname === '/dashboard/api-keys' && 'bg-gray-200 dark:bg-gray-700'}`}>
                <Link
                  href="/dashboard/api-keys"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === '/dashboard/api-keys' ? 'hover:text-gray-800 dark:hover:text-gray-100' : 'hover:text-gray-800 dark:hover:text-gray-100'}`}>
                  <div className="flex items-center">
                    <svg className="shrink-0 h-6 w-6" viewBox="0 0 24 24">
                      <path
                        className={`fill-current ${pathname === '/dashboard/api-keys' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`}
                        d="M12 2.25L1 12h3v8h6v-6h4v6h6v-8h3L12 2.25z"
                      />
                    </svg>
                    <span className="text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 text-gray-800 dark:text-gray-100">
                      API Keys
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Expand / collapse button */}
        <div className="pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto">
          <div className="w-12 pl-4 pr-3 py-2">
            <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
              <span className="sr-only">Expand / collapse sidebar</span>
              <svg className="shrink-0 fill-current text-gray-400 dark:text-gray-500 sidebar-expanded:rotate-180" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <path d="M15 16a1 1 0 0 1-1-1V1a1 1 0 1 1 2 0v14a1 1 0 0 1-1 1ZM8.586 7H1a1 1 0 1 0 0 2h7.586l-2.793 2.793a1 1 0 1 0 1.414 1.414l4.5-4.5A.997.997 0 0 0 12 8.01M11.924 7.617a.997.997 0 0 0-.217-.324l-4.5-4.5a1 1 0 0 0-1.414 1.414L8.586 7M12 7.99a.996.996 0 0 0-.076-.373Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

