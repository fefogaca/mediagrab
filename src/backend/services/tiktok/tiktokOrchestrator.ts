/**
 * Orquestrador para TikTok
 * Tenta múltiplos métodos: yt-dlp → API → Scraping
 */

import { executeFallback } from '../fallback/fallbackOrchestrator';
import type { ExtractorOptions, ExtractorResult } from '../common/types';
import { TikTokYtDlpExtractor } from './extractors/tiktokYtdlpExtractor';
import { TikTokApiExtractor } from './extractors/tiktokApiExtractor';
import { TikTokScrapingExtractor } from './extractors/tiktokScrapingExtractor';
import type { IExtractor } from '../common/extractorInterface';

// Instâncias dos extractors
const extractors: IExtractor[] = [
  new TikTokYtDlpExtractor(),      // Método 1: yt-dlp (mais confiável)
  new TikTokApiExtractor(),        // Método 2: API não oficial
  new TikTokScrapingExtractor(),   // Método 3: Scraping HTML (fallback)
];

/**
 * Resolve informações de mídia do TikTok usando múltiplos métodos
 */
export async function resolveTikTokMedia(
  url: string,
  options?: ExtractorOptions
): Promise<ExtractorResult> {
  return executeFallback(extractors, url, {
    ...options,
    parallel: false, // Executar em sequência
    timeout: 30000, // 30 segundos por método
  });
}

/**
 * Lista os extractors disponíveis para TikTok
 */
export function getAvailableExtractors(): string[] {
  return extractors.map(e => e.name);
}
