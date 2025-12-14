/**
 * Orquestrador para Twitter/X
 * Tenta múltiplos métodos: GraphQL → Scraping → yt-dlp (fallback via mediaResolver)
 */

import { executeFallback } from '../fallback/fallbackOrchestrator';
import type { ExtractorOptions, ExtractorResult } from '../common/types';
import { TwitterGraphQLExtractor } from './extractors/twitterGraphQLExtractor';
import { TwitterScrapingExtractor } from './extractors/twitterScrapingExtractor';
import type { IExtractor } from '../common/extractorInterface';

// Instâncias dos extractors
const extractors: IExtractor[] = [
  new TwitterGraphQLExtractor(), // Método 1: GraphQL (mais confiável, requer cookies)
  new TwitterScrapingExtractor(), // Método 2: Scraping HTML (fallback)
  // yt-dlp será usado como último recurso via mediaResolver original
];

/**
 * Resolve informações de mídia do Twitter usando múltiplos métodos
 */
export async function resolveTwitterMedia(
  url: string,
  options?: ExtractorOptions
): Promise<ExtractorResult> {
  return executeFallback(extractors, url, {
    ...options,
    parallel: false, // Executar em sequência (GraphQL pode precisar de cookies, scraping pode não funcionar bem em paralelo)
    timeout: 30000, // 30 segundos por método
  });
}

/**
 * Lista os extractors disponíveis para Twitter
 */
export function getAvailableExtractors(): string[] {
  return extractors.map(e => e.name);
}
