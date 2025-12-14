/**
 * Adaptadores para converter entre formatos antigos e novos
 */

import type { ResolvedMediaFormat, ResolvedMediaInfo } from '../../server/mediaResolver';
import type { ExtractedMediaInfo, ExtractorResult } from './types';
import type { MediaProvider } from '../../media/providers';

/**
 * Converte ExtractorResult para ResolvedMediaInfo (formato antigo)
 */
export function convertToResolvedMediaInfo(
  result: ExtractorResult,
  provider: MediaProvider
): ResolvedMediaInfo {
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Extração falhou');
  }

  const formats: ResolvedMediaFormat[] = result.data.formats.map((format) => ({
    format_id: format.format_id,
    ext: format.ext,
    resolution: format.resolution,
    quality: format.quality,
    vcodec: format.vcodec,
    acodec: format.acodec,
    filesize_approx: format.filesize_approx,
    source: result.method as any, // Converter para MediaLibrarySource
    url: format.url, // Preservar URL direta se disponível
  }));

  return {
    title: result.data.title,
    provider,
    formats,
    library: result.method as any,
  };
}

/**
 * Converte ExtractedMediaInfo para o formato usado internamente
 */
export function convertExtractedToResolved(
  extracted: ExtractedMediaInfo,
  provider: MediaProvider,
  source: string
): ResolvedMediaInfo {
  const formats: ResolvedMediaFormat[] = extracted.formats.map((format) => ({
    format_id: format.format_id,
    ext: format.ext,
    resolution: format.resolution,
    quality: format.quality,
    vcodec: format.vcodec,
    acodec: format.acodec,
    filesize_approx: format.filesize_approx,
    source: source as any,
    url: format.url, // Preservar URL direta se disponível
  }));

  return {
    title: extracted.title,
    provider,
    formats,
    library: source as any,
  };
}
