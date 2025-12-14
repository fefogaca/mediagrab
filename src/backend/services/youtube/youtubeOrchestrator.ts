/**
 * Orquestrador para YouTube
 * Tenta múltiplos métodos na ordem: yt-dlp → Scraping → ytdl-core
 * (YouTube API não fornece URLs de stream, então só usamos para validação)
 */

import { executeFallback } from '../fallback/fallbackOrchestrator';
import type { ExtractorOptions, ExtractorResult } from '../common/types';
import { YtDlpExtractor } from './extractors/ytdlpExtractor';
import { YouTubeScrapingExtractor } from './extractors/youtubeScrapingExtractor';
import { YoutubeDlExtractor } from './extractors/youtubeDlExtractor';
import type { IExtractor } from '../common/extractorInterface';

// Instâncias dos extractors
const extractors: IExtractor[] = [
  new YtDlpExtractor(),           // Método 1: yt-dlp (mais confiável)
  new YouTubeScrapingExtractor(), // Método 2: Scraping HTML
  new YoutubeDlExtractor(),       // Método 3: ytdl-core (fallback)
];

/**
 * Resolve informações de mídia do YouTube usando múltiplos métodos
 */
export async function resolveYouTubeMedia(
  url: string,
  options?: ExtractorOptions
): Promise<ExtractorResult> {
  // Tentar métodos em paralelo para velocidade, mas se falhar, tentar sequencialmente também
  const result = await executeFallback(extractors, url, {
    ...options,
    parallel: true, // Executar em paralelo para velocidade
    timeout: 30000, // 30 segundos por método
  });

  // Se falhou em paralelo, tentar sequencialmente (às vezes ajuda)
  if (!result.success && extractors.length > 1) {
    console.log('[YouTubeOrchestrator] Falhou em paralelo, tentando sequencialmente...');
    return executeFallback(extractors, url, {
      ...options,
      parallel: false, // Tentar sequencialmente
      timeout: 30000,
    });
  }

  return result;
}

/**
 * Lista os extractors disponíveis para YouTube
 */
export function getAvailableExtractors(): string[] {
  return extractors.map(e => e.name);
}
