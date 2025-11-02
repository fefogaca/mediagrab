'use client';
import React, { useState, Fragment, useRef } from 'react';
import Link from 'next/link';
// import { Transition } from '@headlessui/react'; // Using a library for robust transitions

// Define the structure of a format from the API
interface MediaFormat {
  format_id: string;
  ext: string;
  resolution: string;
  quality: number;
  vcodec: string;
  acodec: string;
  filesize_approx?: number;
  download_url: string;
}

export default function Home() {
  // State for the input URL
  const [url, setUrl] = useState<string>('');
  // State to manage loading during API calls
  const [loading, setLoading] = useState<boolean>(false);
  // State for storing and displaying errors
  const [error, setError] = useState<string | null>(null);
  
  // State for the fetched media formats and video title
  const [formats, setFormats] = useState<MediaFormat[]>([]);
  const [videoTitle, setVideoTitle] = useState<string>('');
  // Ref for the results section to enable smooth scrolling
  const resultsRef = useRef<HTMLDivElement>(null);

  // Function to handle the form submission and fetch download links
  const handleGetLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormats([]);
    setVideoTitle('');

    try {
      // Fetch download links from the public API endpoint
      const response = await fetch(`/api/public-download?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (response.ok) {
        setVideoTitle(data.title);
        setFormats(data.formats);
        // Scroll to the results section after a short delay
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error(data.message || 'Failed to get download links.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="px-4 lg:px-6 h-14 flex items-center">
          <Link href="#" className="flex items-center justify-center">
            <MountainIcon className="h-6 w-6 text-violet-500" />
            <span className="sr-only">MediaGrab</span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 dark:text-gray-300">Admin</Link>
            <Link href="/pricing" className="text-sm font-medium hover:underline underline-offset-4 dark:text-gray-300">Pricing</Link>
            <Link href="/docs" className="text-sm font-medium hover:underline underline-offset-4 dark:text-gray-300">Docs</Link>
            <Link href="/contact" className="text-sm font-medium hover:underline underline-offset-4 dark:text-gray-300">Contact</Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center items-center">
          <section className="w-full py-12 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col items-center space-y-6 text-center">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-sky-500">
                    The Ultimate Media Downloading API
                  </h1>
                  <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                    Paste a link to instantly generate download links for any video or audio. Powerful, reliable, and easy to integrate.
                  </p>
                </div>
                <div className="w-full max-w-2xl">
                  <form onSubmit={handleGetLinks} className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="url"
                      className="flex-1 w-full px-4 py-3 text-lg border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 font-medium text-white bg-violet-600 rounded-md shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 transition-all duration-200"
                      disabled={loading}
                    >
                      {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : 'Get Links'}
                    </button>
                  </form>
                  {error && <p className="mt-4 text-red-500">Error: {error}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Download Links Section */}
          {formats.length > 0 && (
            <section ref={resultsRef} className="w-full py-12 md:py-24 bg-gray-100 dark:bg-gray-800">
              <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-800 dark:text-gray-100 mb-8 text-center">Download Links for: {videoTitle}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {formats.map((format) => (
                    <div key={format.format_id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 flex flex-col justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resolution: {format.resolution}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Extension: {format.ext}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Codecs: {`${format.vcodec !== 'none' ? format.vcodec : ''}${format.vcodec !== 'none' && format.acodec !== 'none' ? ', ' : ''}${format.acodec !== 'none' ? format.acodec : ''}`}</p>
                      </div>
                      <div className="mt-4 text-right">
                        <a href={format.download_url} download className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500">
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 MediaGrab. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="/terms" className="text-xs hover:underline underline-offset-4">Terms of Service</Link>
            <Link href="/privacy" className="text-xs hover:underline underline-offset-4">Privacy</Link>
            <a href="https://felipefogaca.net" target="_blank" rel="noopener noreferrer" className="text-xs hover:underline underline-offset-4">Developer</a>
          </nav>
        </footer>
      </div>
    </>
  );
}

function MountainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}