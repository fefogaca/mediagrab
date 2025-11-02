'use client';
import React, { useState, Fragment } from 'react';
import Link from 'next/link';
import { Transition } from '@headlessui/react'; // Using a library for robust transitions

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
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formats, setFormats] = useState<MediaFormat[]>([]);
  const [videoTitle, setVideoTitle] = useState<string>('');

  const handleGetLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormats([]);

    try {
      const response = await fetch(`/api/public-download?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (response.ok) {
        setVideoTitle(data.title);
        setFormats(data.formats);
        setModalOpen(true);
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
        <main className="flex-1 flex items-center">
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
        </main>

        {/* Footer */}
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 MediaGrab. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="/terms" className="text-xs hover:underline underline-offset-4">Terms of Service</Link>
            <Link href="/privacy" className="text-xs hover:underline underline-offset-4">Privacy</Link>
          </nav>
        </footer>
      </div>

      {/* Download Links Modal */}
      <Transition show={modalOpen} as={Fragment}>
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as="div"
              className="fixed inset-0 bg-black bg-opacity-50 z-10"
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            />

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <Transition.Child
              as="div"
              className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl z-30"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
                <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">{videoTitle}</h3>
                  <button onClick={() => setModalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="mt-4 max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Resolution</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Extension</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Codecs</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Download</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {formats.map((format) => (
                        <tr key={format.format_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{format.resolution}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{format.ext}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{`${format.vcodec !== 'none' ? format.vcodec : ''}${format.vcodec !== 'none' && format.acodec !== 'none' ? ', ' : ''}${format.acodec !== 'none' ? format.acodec : ''}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href={format.download_url} download className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300">Download</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Transition>
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
