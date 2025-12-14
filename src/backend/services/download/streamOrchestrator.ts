/**
 * Orquestrador de streaming
 * Garante que sempre consiga fazer streaming, usando múltiplos métodos
 */

import YTDlpWrap from 'yt-dlp-wrap';
import ytdl from 'ytdl-core';
import { detectMediaProvider } from '../../media/providers';
import { getCookiesConfig } from '../../lib/cookies';

const ytDlpWrap = new YTDlpWrap();

export interface StreamOptions {
  format?: string;
  url: string;
  platform: 'youtube' | 'twitter' | 'instagram' | 'tiktok';
}

/**
 * Obtém stream de vídeo usando o melhor método disponível
 */
export async function getVideoStream(options: StreamOptions): Promise<NodeJS.ReadableStream> {
  const { url, format = 'best', platform } = options;

  // Para YouTube, tentar múltiplos métodos
  if (platform === 'youtube') {
    // Método 1: yt-dlp (mais confiável)
    try {
      return await streamWithYtDlp(url, format, platform);
    } catch (error) {
      console.warn('[StreamOrchestrator] yt-dlp falhou, tentando ytdl-core...', error);
      
      // Método 2: ytdl-core (fallback)
      try {
        return ytdl(url, { quality: format });
      } catch (fallbackError) {
        console.error('[StreamOrchestrator] ytdl-core também falhou:', fallbackError);
        throw new Error('Todos os métodos de streaming falharam');
      }
    }
  }

  // Para outras plataformas, usar yt-dlp
  return streamWithYtDlp(url, format, platform);
}

/**
 * Faz streaming usando yt-dlp
 */
async function streamWithYtDlp(
  url: string,
  format: string,
  platform: 'youtube' | 'twitter' | 'instagram' | 'tiktok'
): Promise<NodeJS.ReadableStream> {
  // Obter configuração de cookies (arquivo ou navegador)
  const { getCookiesConfig } = await import('../../lib/cookies');
  let cookiesConfig: { type: 'file'; path: string } | { type: 'browser'; browser: string; profile?: string } | null = null;
  if (platform === 'instagram' || platform === 'youtube' || platform === 'twitter') {
    try {
      cookiesConfig = await getCookiesConfig(platform);
    } catch (error) {
      console.warn('[StreamOrchestrator] Erro ao obter cookies:', error);
    }
  }

  const isTwitter = platform === 'twitter';
  const isInstagram = platform === 'instagram';
  const isYouTube = platform === 'youtube';

  // Preparar opções otimizadas
  const ytDlpOptions = [
    url,
    '-f', format,
    '-o', '-',
    '--no-playlist',
    '--quiet',
    '--no-progress',
    '--buffer-size', isInstagram ? '512K' : (isTwitter ? '256K' : '128K'),
    '--http-chunk-size', isInstagram ? '32M' : (isTwitter ? '24M' : '16M'),
    '--concurrent-fragments', isInstagram ? '10' : (isTwitter ? '8' : '6'),
    '--retries', '3',
    '--fragment-retries', '3',
    '--extractor-retries', '2',
    '--ignore-errors',
    '--socket-timeout', isTwitter ? '60' : '30',
    '--no-part',
    '--no-mtime',
  ];

  if (isTwitter || isInstagram || isYouTube) {
    ytDlpOptions.push('--merge-output-format', 'mp4');
  }

  // Adicionar cookies (arquivo ou navegador)
  if (cookiesConfig) {
    if (cookiesConfig.type === 'file') {
      ytDlpOptions.push('--cookies', cookiesConfig.path);
    } else if (cookiesConfig.type === 'browser') {
      // Usar cookies do navegador
      const browserArg = cookiesConfig.profile 
        ? `${cookiesConfig.browser}:${cookiesConfig.profile}`
        : cookiesConfig.browser;
      ytDlpOptions.push('--cookies-from-browser', browserArg);
      console.log(`[StreamOrchestrator] Usando cookies do navegador: ${browserArg}`);
    }
  }

  if (isYouTube) {
    ytDlpOptions.push('--extractor-args', 'youtube:player_client=android');
  }

  return ytDlpWrap.execStream(ytDlpOptions);
}
