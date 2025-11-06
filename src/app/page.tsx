'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';

import { validateMediaUrl } from '@/lib/media/providers';

interface MediaFormat {
  format_id: string;
  ext: string;
  resolution: string;
  quality?: string | null;
  vcodec: string;
  acodec: string;
  filesize_approx?: number;
  source: string;
  download_url: string;
}

interface FeedbackState {
  type: 'idle' | 'success' | 'error';
  message?: string;
}

export default function Home() {
  // State for the input URL
  const [url, setUrl] = useState<string>('');
  // State to manage loading during API calls
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<FeedbackState>({ type: 'idle' });
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);
  
  // State for the fetched media formats and video title
  const [formats, setFormats] = useState<MediaFormat[]>([]);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [providerLabel, setProviderLabel] = useState<string | null>(null);
  // Ref for the results section to enable smooth scrolling
  const resultsRef = useRef<HTMLDivElement>(null);

  // Function to handle the form submission and fetch download links
  const handleGetLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'idle' });
    setFormats([]);
    setVideoTitle('');
    setProviderLabel(null);

    const validation = validateMediaUrl(url);
    if (!validation.ok) {
      setLoading(false);
      if (validation.reason === 'UNSUPPORTED_PROVIDER') {
        setDialog({
          title: 'Link não suportado',
          message: validation.message,
        });
      } else {
        setStatus({ type: 'error', message: validation.message });
      }
      return;
    }

    const targetUrl = validation.normalizedUrl;

    try {
      // Fetch download links from the public API endpoint
      const response = await fetch(`/api/public-download?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();

      if (response.ok) {
        setVideoTitle(data.title);
        setFormats(data.formats);
        setProviderLabel(data.provider?.label ?? null);
        const formatsCount = Array.isArray(data.formats) ? data.formats.length : 0;
        setStatus({
          type: 'success',
          message:
            formatsCount > 0
              ? `Pronto! Encontramos ${formatsCount} ${formatsCount === 1 ? 'opção' : 'opções'} para baixar.`
              : 'Nenhum formato disponível no momento.',
        });
        // Scroll to the results section after a short delay
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const errorMessage = data?.error?.message || 'Não foi possível gerar os links para este vídeo.';
        setStatus({ type: 'error', message: errorMessage });

        if (data?.error?.code === 'UNSUPPORTED_PROVIDER') {
          setDialog({
            title: 'Link não suportado',
            message: errorMessage,
          });
        }
      }
    } catch (err) {
      console.error('Falha ao obter links:', err);
      setStatus({
        type: 'error',
        message: 'Não conseguimos falar com o servidor agora. Verifique a conexão e tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || Number.isNaN(bytes)) return 'Tamanho indisponível';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ytdl-core':
        return 'Backup: ytdl-core';
      case 'yt-dlp':
        return 'Principal: yt-dlp';
      default:
        return source;
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
                      ) : 'Gerar links'}
                    </button>
                  </form>
                  {status.type !== 'idle' && status.message && (
                    <div
                      className={`mt-4 rounded-md border px-4 py-3 text-sm transition-colors ${
                        status.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/40 dark:text-rose-200'
                      }`}
                    >
                      {status.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Download Links Section */}
          {formats.length > 0 && (
            <section ref={resultsRef} className="w-full py-12 md:py-24 bg-gray-100 dark:bg-gray-800">
              <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-800 dark:text-gray-100 text-center">
                  Links de download para: {videoTitle}
                </h2>
                {providerLabel && (
                  <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                    Plataforma detectada: {providerLabel}
                  </p>
                )}
                <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {formats.map((format) => (
                    <div key={format.format_id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 flex flex-col justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resolução: {format.resolution}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Extensão: {format.ext.toUpperCase()}</p>
                        {format.quality && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">Qualidade: {format.quality}</p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Codecs: {`${format.vcodec !== 'none' ? format.vcodec : ''}${format.vcodec !== 'none' && format.acodec !== 'none' ? ', ' : ''}${format.acodec !== 'none' ? format.acodec : ''}` || 'Não informado'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Tamanho aproximado: {formatFileSize(format.filesize_approx)}</p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
                          {getSourceLabel(format.source)}
                        </p>
                      </div>
                      <div className="mt-4 text-right">
                        <a href={format.download_url} download className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500">
                          Baixar
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
      {dialog && (
        <FeedbackDialog
          title={dialog.title}
          message={dialog.message}
          onClose={() => setDialog(null)}
        />
      )}
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

interface FeedbackDialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

function FeedbackDialog({ title, message, onClose }: FeedbackDialogProps) {
  const handleOverlayClick = () => {
    onClose();
  };

  const stopPropagation: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="alertdialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 text-left shadow-2xl dark:bg-gray-900"
        onClick={stopPropagation}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}