/**
 * Adaptadores para converter entre formatos antigos e novos
 */

import type { ResolvedMediaFormat, ResolvedMediaInfo, MediaLibrarySource } from '../../server/mediaResolver';
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

  // Mapear método para MediaLibrarySource (usar yt-dlp como padrão para novos métodos)
  const mapMethodToSource = (method: string): MediaLibrarySource => {
    if (method.includes('ytdlp') || method.includes('yt-dlp') || method.includes('graphql') || method.includes('scraping') || method.includes('api')) {
      return 'yt-dlp';
    }
    if (method.includes('distube')) {
      return '@distube/ytdl-core';
    }
    if (method.includes('ytdl-core') && !method.includes('distube')) {
      return 'ytdl-core';
    }
    if (method.includes('play-dl')) {
      return 'play-dl';
    }
    // Para novos métodos (graphql, scraping, etc.), usar yt-dlp como padrão
    return 'yt-dlp';
  };

  const source = mapMethodToSource(result.method);

  const formats: ResolvedMediaFormat[] = result.data.formats.map((format) => ({
    format_id: format.format_id,
    ext: format.ext,
    resolution: format.resolution,
    quality: format.quality,
    vcodec: format.vcodec,
    acodec: format.acodec,
    filesize_approx: format.filesize_approx,
    source,
    url: format.url, // Preservar URL direta se disponível
  }));

  return {
    title: result.data.title,
    provider,
    formats,
    library: source,
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
