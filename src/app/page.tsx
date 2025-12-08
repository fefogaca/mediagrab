'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

import DownloadModal from '@/app/components/DownloadModal';
import { appConfig } from '@/config/app.config';
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
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
        setVideoUrl(targetUrl);
        const formatsCount = Array.isArray(data.formats) ? data.formats.length : 0;
        setStatus({
          type: 'success',
          message:
            formatsCount > 0
              ? `Pronto! Encontramos ${formatsCount} ${formatsCount === 1 ? 'opção' : 'opções'} para baixar.`
              : 'Nenhum formato disponível no momento.',
        });
        // Abrir modal ao invés de scroll
        if (formatsCount > 0) {
          setShowModal(true);
        }
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
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="sticky top-0 z-50 px-4 lg:px-6 h-16 flex items-center backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50">
          <Link href="#" className="flex items-center justify-center group">
            <MountainIcon className="h-7 w-7 text-violet-600 dark:text-violet-400 transition-transform group-hover:scale-110" />
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-sky-600 dark:from-violet-400 dark:to-sky-400 bg-clip-text text-transparent">MediaGrab</span>
            <span className="sr-only">MediaGrab</span>
          </Link>
          <nav className="ml-auto flex items-center gap-6 sm:gap-8">
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center items-center">
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6">
              <div className={`flex flex-col items-center space-y-8 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="space-y-6 max-w-4xl">
                  <div className="inline-block">
                    <span className="px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium border border-violet-200 dark:border-violet-800">
                      ✨ API Poderosa e Confiável
                    </span>
                  </div>
                  <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400 animate-gradient">
                      The Ultimate
                    </span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-violet-600 to-purple-600 dark:from-sky-400 dark:via-violet-400 dark:to-purple-400">
                      Media Downloading API
                    </span>
                  </h1>
                  <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 md:text-xl leading-relaxed">
                    Cole um link e gere instantaneamente links de download para qualquer vídeo ou áudio. Poderoso, confiável e fácil de integrar.
                  </p>
                </div>
                <div className="w-full max-w-3xl">
                  <form onSubmit={handleGetLinks} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-sky-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                    <div className="relative flex flex-col sm:flex-row items-stretch gap-3 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                    <input
                      type="url"
                        className="flex-1 w-full px-6 py-4 text-base sm:text-lg border-0 rounded-xl bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                        placeholder="Cole aqui o link do vídeo (YouTube, Instagram, TikTok, X, etc.)"
                    />
                    <button
                      type="submit"
                        className="group/btn relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white bg-gradient-to-r from-violet-600 to-sky-600 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
                      disabled={loading}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                            <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                              <span>Processando...</span>
                            </>
                          ) : (
                            <>
                              <span>Gerar Links</span>
                              <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </>
                          )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-sky-700 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    </button>
                    </div>
                  </form>
                  {status.type !== 'idle' && status.message && (
                    <div
                      className={`mt-6 rounded-xl border px-6 py-4 text-sm transition-all duration-300 animate-fade-in ${
                        status.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 shadow-lg shadow-emerald-500/10'
                          : 'border-rose-200 bg-rose-50/80 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 shadow-lg shadow-rose-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {status.type === 'success' ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{status.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="w-full py-16 md:py-24 bg-gradient-to-b from-transparent via-gray-50/50 to-gray-100 dark:via-gray-800/50 dark:to-gray-900">
              <div className="container mx-auto px-4 md:px-6">
              <div className="text-center mb-16 space-y-4">
                <div className="inline-block">
                  <span className="px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium border border-violet-200 dark:border-violet-800">
                    🚀 Funcionalidades
                  </span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-sky-600 dark:from-violet-400 dark:to-sky-400">
                  Por que escolher MediaGrab?
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Uma API poderosa, confiável e fácil de integrar para todas as suas necessidades de download de mídia
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Feature 1 */}
                <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Ultra Rápido</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Processamento instantâneo de links. Obtenha informações e links de download em segundos.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Múltiplas Plataformas</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Suporte para YouTube, Instagram, TikTok, Twitter/X, Vimeo, Facebook e muito mais.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Seguro e Confiável</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Autenticação via API keys, limites de uso configuráveis e proteção contra abuso.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Fácil Integração</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    API RESTful simples e intuitiva. Documentação completa com exemplos práticos.
                        </p>
                      </div>

                {/* Feature 5 */}
                <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Atualizações Constantes</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Mantemos a API sempre atualizada para suportar as últimas mudanças das plataformas.
                  </p>
                      </div>

                {/* Feature 6 */}
                <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Métricas Detalhadas</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Dashboard completo com estatísticas de uso, downloads e performance da sua API.
                  </p>
                </div>
                </div>
              </div>
            </section>
        </main>

        {/* Footer */}
        <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center justify-between px-4 md:px-6 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400">&copy; 2024 MediaGrab. Todos os direitos reservados.</p>
          <nav className="flex gap-6">
            <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Privacy</Link>
            <a href={appConfig.ui.developerUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Developer</a>
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
      <DownloadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={videoTitle}
        formats={formats}
        providerLabel={providerLabel}
        videoUrl={videoUrl}
      />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-8 text-left shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in"
        onClick={stopPropagation}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Entendi
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}