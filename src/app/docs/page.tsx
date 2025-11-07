'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { appConfig } from '@/config/app.config';

// Componente para blocos de código com syntax highlighting
const CodeBlock = ({ children, lang, title }: { children: string; lang: string; title?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-xl my-6 overflow-hidden border border-gray-800 shadow-xl max-w-full">
      {title && (
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-xs font-medium text-gray-400">{title}</span>
        </div>
      )}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{lang}</span>
        <button 
          onClick={handleCopy}
          className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2 flex-shrink-0"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm text-gray-100 m-0"><code className="block whitespace-pre-wrap break-all" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{children}</code></pre>
      </div>
    </div>
  );
};

// Componente para badges de status
const StatusBadge = ({ status, children }: { status: 'success' | 'info' | 'warning'; children: React.ReactNode }) => {
  const colors = {
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
      {children}
    </span>
  );
};

const DocsPage = () => {
  const apiBaseUrl = appConfig.apiBaseUrl;

  const exampleResponse = JSON.stringify({
    "title": "Example Video Title",
    "requested_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "provider": {
      "id": "youtube",
      "label": "YouTube"
    },
    "library": "yt-dlp",
    "formats": [
      {
        "format_id": "313",
        "ext": "mp4",
        "resolution": "3840x2160",
        "quality": "4K",
        "vcodec": "av01.0.13M.10",
        "acodec": "none",
        "filesize_approx": 157383383,
        "source": "yt-dlp",
        "download_url": `${apiBaseUrl}/api/download-direct?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=313&source=yt-dlp`
      },
      {
        "format_id": "140",
        "ext": "m4a",
        "resolution": "Audio Only",
        "quality": "High",
        "vcodec": "none",
        "acodec": "mp4a.40.2",
        "filesize_approx": 3094343,
        "source": "yt-dlp",
        "download_url": `${apiBaseUrl}/api/download-direct?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=140&source=yt-dlp`
      }
    ]
  }, null, 2);

  const errorResponse = JSON.stringify({
    "error": {
      "code": "INVALID_API_KEY",
      "message": "Esta chave de API não foi encontrada ou está inativa."
    }
  }, null, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 lg:px-6 h-16 flex items-center backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50">
        <Link href="/" className="flex items-center justify-center group">
          <svg className="h-7 w-7 text-violet-600 dark:text-violet-400 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3l4 8 5-5 5 15H2L8 3z" />
          </svg>
          <span className="ml-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-sky-600 dark:from-violet-400 dark:to-sky-400 bg-clip-text text-transparent">MediaGrab</span>
        </Link>
        <nav className="ml-auto flex items-center gap-6 sm:gap-8">
          <Link href="/pricing" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors relative group py-2">
            Pricing
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 transition-all group-hover:w-full"></span>
          </Link>
          <Link href="/docs" className="text-sm font-semibold text-violet-600 dark:text-violet-400 relative group py-2">
            Docs
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 dark:bg-violet-400"></span>
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
      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-24 max-w-5xl">
        <div className="space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium border border-violet-200 dark:border-violet-800">
                📚 Documentação Completa
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400">
                API Documentation
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Integre a MediaGrab API em minutos. Documentação completa com exemplos práticos e guias passo a passo.
            </p>
          </section>

          {/* Quick Start */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quick Start</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Comece a usar a API em menos de 5 minutos</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-lg space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Obtenha sua API Key</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Acesse o <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">painel administrativo</Link> e gere sua chave de API.
                      Você pode criar múltiplas chaves para diferentes projetos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Faça sua primeira requisição</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Use o endpoint <code className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded text-sm font-mono">/api/download</code> com sua API key:
                    </p>
                    <CodeBlock lang="bash" title="Exemplo de Requisição">
{`curl "${apiBaseUrl}/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&apikey=SUA_API_KEY"`}
                    </CodeBlock>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Use os links de download</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      A resposta contém todos os formatos disponíveis com links diretos de download. 
                      Escolha o formato desejado e inicie o download.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Autenticação</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Todas as requisições requerem autenticação via API Key</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-lg space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Forneça sua API key como parâmetro de query <code className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded text-sm font-mono">apikey</code> em todas as requisições.
              </p>
              <CodeBlock lang="bash">
{`curl "${apiBaseUrl}/api/download?url=<VIDEO_URL>&apikey=<YOUR_API_KEY>"`}
              </CodeBlock>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Importante</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Mantenha sua API key segura e nunca a compartilhe publicamente. Cada chave tem limites de uso baseados no seu plano.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* API Reference */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Referência da API</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Documentação completa de todos os endpoints</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-lg space-y-8">
              {/* Get Video Info Endpoint */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">GET /api/download</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Obtém informações e links de download para um vídeo</p>
                  </div>
                  <StatusBadge status="success">Disponível</StatusBadge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Parâmetros</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <code className="text-sm font-mono text-violet-600 dark:text-violet-400 font-semibold">url</code>
                        <div className="flex-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">obrigatório</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">URL do vídeo que deseja processar</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <code className="text-sm font-mono text-violet-600 dark:text-violet-400 font-semibold">apikey</code>
                        <div className="flex-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">obrigatório</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sua chave de API para autenticação</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Exemplo de Requisição</h4>
                    <CodeBlock lang="bash">
{`curl "${apiBaseUrl}/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&apikey=user-key-123"`}
                    </CodeBlock>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Resposta de Sucesso (200 OK)</h4>
                    <CodeBlock lang="json">
                      {exampleResponse}
                    </CodeBlock>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Resposta de Erro (401 Unauthorized)</h4>
                    <CodeBlock lang="json">
                      {errorResponse}
                    </CodeBlock>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Supported Platforms */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Plataformas Suportadas</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Mais de 10 plataformas principais</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'Vimeo', 'Facebook', 'Dailymotion', 'SoundCloud'].map((platform) => (
                <div key={platform} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center hover:shadow-lg transition-shadow">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{platform}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Error Codes */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Códigos de Erro</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Entenda os possíveis erros e como resolvê-los</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-lg space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Código</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Status HTTP</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-3 px-4 font-mono text-violet-600 dark:text-violet-400">MISSING_API_KEY</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">401</span></td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">API key não fornecida</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-violet-600 dark:text-violet-400">INVALID_API_KEY</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">401</span></td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">API key inválida ou inativa</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-violet-600 dark:text-violet-400">USAGE_LIMIT_EXCEEDED</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">429</span></td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Limite de requisições atingido</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-violet-600 dark:text-violet-400">MISSING_URL</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">400</span></td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">URL não fornecida</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-violet-600 dark:text-violet-400">UNSUPPORTED_PROVIDER</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">415</span></td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Plataforma não suportada</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-violet-600 to-sky-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-lg text-violet-100 mb-8 max-w-2xl mx-auto">
              Gere sua API key agora e comece a integrar a MediaGrab API no seu projeto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-violet-600 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
              >
                Acessar Admin Panel
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-violet-700/50 text-white rounded-xl font-semibold hover:bg-violet-700/70 transition-all border border-white/20"
              >
                Ver Planos
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center justify-between px-4 md:px-6 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm mt-16">
        <p className="text-sm text-gray-600 dark:text-gray-400">&copy; 2024 MediaGrab. Todos os direitos reservados.</p>
        <nav className="flex gap-6">
          <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Privacy</Link>
          <a href={appConfig.ui.developerUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Developer</a>
        </nav>
      </footer>
    </div>
  );
};

export default DocsPage;
