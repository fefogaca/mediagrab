/**
 * Orquestrador para Instagram
 * Tenta múltiplos métodos: GraphQL → Scraping → yt-dlp
 */

import { executeFallback } from '../fallback/fallbackOrchestrator';
import type { ExtractorOptions, ExtractorResult } from '../common/types';
import { InstagramYtDlpExtractor } from './extractors/ytdlpExtractor';
import { InstagramGraphQLExtractor } from './extractors/instagramGraphQLExtractor';
import { InstagramScrapingExtractor } from './extractors/instagramScrapingExtractor';
import { InstagramPrivateApiExtractor } from './extractors/instagramPrivateApiExtractor';
import type { IExtractor } from '../common/extractorInterface';

// Instâncias dos extractors (ordem: mais confiável primeiro)
const extractors: IExtractor[] = [
  new InstagramYtDlpExtractor(),        // Método 1: yt-dlp (mais confiável, suporta todos os tipos)
  new InstagramPrivateApiExtractor(),   // Método 2: Private API (requer credenciais, muito confiável)
  new InstagramGraphQLExtractor(),      // Método 3: GraphQL (requer cookies)
  new InstagramScrapingExtractor(),     // Método 4: Scraping HTML (fallback)
];

/**
 * Resolve informações de mídia do Instagram usando múltiplos métodos
 */
export async function resolveInstagramMedia(
  url: string,
  options?: ExtractorOptions
): Promise<ExtractorResult> {
  return executeFallback(extractors, url, {
    ...options,
    parallel: false, // Executar em sequência (GraphQL pode precisar de cookies)
    timeout: 30000, // 30 segundos por método
  });
}

/**
 * Lista os extractors disponíveis para Instagram
 */
export function getAvailableExtractors(): string[] {
  return extractors.map(e => e.name);
}
