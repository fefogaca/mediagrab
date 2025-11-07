import YTDlpWrap from 'yt-dlp-wrap';
import ytdlCore from 'ytdl-core';
import type { videoFormat } from 'ytdl-core';

import {
  detectMediaProvider,
  type MediaProvider,
  type MediaProviderId,
} from '../media/providers';

export type MediaLibrarySource = 'yt-dlp' | 'ytdl-core';

export interface ResolvedMediaFormat {
  format_id: string;
  ext: string;
  resolution: string;
  quality?: string | null;
  vcodec: string;
  acodec: string;
  filesize_approx?: number;
  source: MediaLibrarySource;
}

export interface ResolvedMediaInfo {
  title: string;
  provider: MediaProvider;
  formats: ResolvedMediaFormat[];
  library: MediaLibrarySource;
}

export type MediaResolverErrorCode =
  | 'UNSUPPORTED_PROVIDER'
  | 'RESOLUTION_FAILED';

export class MediaResolverError extends Error {
  constructor(
    public readonly code: MediaResolverErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MediaResolverError';
  }
}

const ytDlpWrap = new YTDlpWrap();

// User agents modernos para evitar detecção
const USER_AGENTS = {
  default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  tiktok: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  twitter: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

function getYtDlpOptions(providerId: MediaProviderId): string[] {
  const options: string[] = [];
  
  // User agent específico por plataforma
  const userAgent = USER_AGENTS[providerId as keyof typeof USER_AGENTS] || USER_AGENTS.default;
  options.push('--user-agent', userAgent);
  
  // Configurações gerais (removendo opções que podem causar problemas)
  options.push('--no-warnings');
  options.push('--quiet');
  // --no-call-home foi removido pois está deprecated no yt-dlp
  
  // Configurações específicas por plataforma (apenas as essenciais)
  switch (providerId) {
    case 'youtube':
      options.push('--extractor-args', 'youtube:player_client=android,web');
      break;
    case 'instagram':
      // Instagram funciona melhor sem opções extras
      break;
    case 'tiktok':
      // TikTok funciona melhor sem opções extras
      break;
    case 'twitter':
      // Twitter funciona melhor sem opções extras
      break;
  }
  
  return options;
}

export async function resolveMediaInfo(url: string): Promise<ResolvedMediaInfo> {
  const provider = detectMediaProvider(url);
  if (!provider) {
    throw new MediaResolverError(
      'UNSUPPORTED_PROVIDER',
      'Este link não é suportado para download.',
    );
  }

  const attempts: MediaLibrarySource[] = ['yt-dlp'];
  if (provider.id === 'youtube') {
    attempts.push('ytdl-core');
  }

  const errors: Partial<Record<MediaLibrarySource, unknown>> = {};

  for (const library of attempts) {
    try {
      if (library === 'yt-dlp') {
        const info = await fetchWithYtDlp(url, provider.id);
        return {
          title: info.title,
          provider,
          library,
          formats: info.formats.map((format) => ({ ...format, source: library })),
        };
      }

      if (library === 'ytdl-core') {
        const info = await fetchWithYtdl(url, provider.id);
        if (info) {
          return {
            title: info.title,
            provider,
            library,
            formats: info.formats.map((format) => ({ ...format, source: library })),
          };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCause = (error as any)?.cause;
      const errorStderr = (error as any)?.stderr || '';
      
      console.error(`[${provider.id}] Erro ao tentar resolver com ${library}:`, {
        message: errorMessage,
        cause: errorCause ? String(errorCause) : undefined,
        stderr: errorStderr || undefined,
      });
      
      errors[library] = error;
    }
  }

  const fallbackError =
    errors['yt-dlp'] || errors['ytdl-core'] || new Error('Unknown failure');

  throw new MediaResolverError(
    'RESOLUTION_FAILED',
    'Não foi possível preparar este download. Tente novamente em instantes.',
    fallbackError,
  );
}

interface RawFormat {
  format_id: string;
  ext: string;
  resolution: string;
  quality?: string | null;
  vcodec: string;
  acodec: string;
  filesize_approx?: number;
}

interface YtDlpFormat {
  format_id?: string | number;
  format?: string;
  ext?: string;
  resolution?: string;
  quality?: string;
  format_note?: string;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
}

async function fetchWithYtDlp(url: string, providerId: MediaProviderId): Promise<{ title: string; formats: RawFormat[] }>
{
  // Primeiro tentar com getVideoInfo (método mais confiável e simples)
  // Se falhar, tentar com opções customizadas via execPromise
  try {
    const videoInfo = await ytDlpWrap.getVideoInfo(url);
    const { title, formats } = videoInfo;

    const processedFormats = formats
      .filter((format: YtDlpFormat) => {
        const hasVideo = format.vcodec && format.vcodec !== 'none';
        const hasAudio = format.acodec && format.acodec !== 'none';
        return hasVideo || hasAudio;
      })
      .map((format: YtDlpFormat): RawFormat => ({
        format_id: String(format.format_id ?? format.format ?? ''),
        ext: format.ext ?? 'mp4',
        resolution:
          format.resolution ||
          (format.acodec !== 'none' && format.vcodec === 'none'
            ? 'Áudio'
            : format.vcodec !== 'none' && format.acodec === 'none'
              ? 'Vídeo'
              : 'Desconhecido'),
        quality: format.quality || format.format_note || null,
        vcodec: format.vcodec || 'none',
        acodec: format.acodec || 'none',
        filesize_approx: format.filesize || format.filesize_approx,
      }));

    return {
      title,
      formats: processedFormats,
    };
  } catch (error) {
    // Se getVideoInfo falhar, tentar com opções customizadas via execPromise
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCause = (error as any)?.cause;
    const errorStderr = (error as any)?.stderr || '';
    
    console.warn(`[${providerId}] Falha com getVideoInfo padrão, tentando com opções customizadas:`, {
      message: errorMessage,
      cause: errorCause ? String(errorCause) : undefined,
      stderr: errorStderr || undefined,
    });
    
    try {
      const options = getYtDlpOptions(providerId);
      const args = [...options, url, '--dump-json', '--no-playlist'];
      const videoInfoJson = await ytDlpWrap.execPromise(args);
      
      const jsonString = typeof videoInfoJson === 'string' 
        ? videoInfoJson 
        : String(videoInfoJson);
      
      // Limpar o output (pode conter logs antes do JSON)
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[${providerId}] Resposta inválida do yt-dlp. Output:`, jsonString.substring(0, 500));
        throw new Error('Resposta inválida do yt-dlp');
      }
      
      const videoInfo = JSON.parse(jsonMatch[0]);
      const { title, formats } = videoInfo;

      if (!formats || !Array.isArray(formats) || formats.length === 0) {
        console.error(`[${providerId}] Nenhum formato disponível para: ${url}`);
        throw new Error('Nenhum formato disponível');
      }

      const processedFormats = formats
        .filter((format: YtDlpFormat) => {
          const hasVideo = format.vcodec && format.vcodec !== 'none';
          const hasAudio = format.acodec && format.acodec !== 'none';
          return hasVideo || hasAudio;
        })
        .map((format: YtDlpFormat): RawFormat => ({
          format_id: String(format.format_id ?? format.format ?? ''),
          ext: format.ext ?? 'mp4',
          resolution:
            format.resolution ||
            (format.acodec !== 'none' && format.vcodec === 'none'
              ? 'Áudio'
              : format.vcodec !== 'none' && format.acodec === 'none'
                ? 'Vídeo'
                : 'Desconhecido'),
          quality: format.quality || format.format_note || null,
          vcodec: format.vcodec || 'none',
          acodec: format.acodec || 'none',
          filesize_approx: format.filesize || format.filesize_approx,
        }));

      if (processedFormats.length === 0) {
        console.error(`[${providerId}] Nenhum formato válido após processamento para: ${url}`);
        throw new Error('Nenhum formato válido após processamento');
      }

      console.log(`[${providerId}] Sucesso com opções customizadas. Formatos encontrados: ${processedFormats.length}`);
      return {
        title,
        formats: processedFormats,
      };
    } catch (fallbackError) {
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      const fallbackCause = (fallbackError as any)?.cause;
      const fallbackStderr = (fallbackError as any)?.stderr || '';
      
      console.error(`[${providerId}] Falha no fallback também:`, {
        originalError: errorMessage,
        fallbackError: fallbackMessage,
        cause: fallbackCause ? String(fallbackCause) : undefined,
        stderr: fallbackStderr || undefined,
      });
      
      // Se ambos falharem, relançar o erro original
      throw error;
    }
  }
}

async function fetchWithYtdl(
  url: string,
  providerId: MediaProviderId,
): Promise<{ title: string; formats: RawFormat[] } | null> {
  if (providerId !== 'youtube') {
    return null;
  }

  const info = await ytdlCore.getInfo(url);
  const formats = info.formats
    .filter((format: videoFormat) => format.hasVideo || format.hasAudio)
    .map((format: videoFormat): RawFormat => {
      const codecs = splitCodecs(format.codecs);
      const resolution = format.qualityLabel
        ? format.qualityLabel
        : format.hasAudio && !format.hasVideo
          ? 'Áudio'
          : format.hasVideo && !format.hasAudio
            ? 'Vídeo'
            : 'Desconhecido';

      return {
        format_id: format.itag ? String(format.itag) : format.mimeType ?? 'fallback',
        ext: format.container ?? inferExtensionFromMime(format.mimeType),
        resolution,
        quality: format.audioQuality || format.qualityLabel || null,
        vcodec: codecs.video,
        acodec: codecs.audio,
        filesize_approx: format.contentLength
          ? Number(format.contentLength)
          : undefined,
      };
    });

  return {
    title: info.videoDetails.title,
    formats,
  };
}

function splitCodecs(codecString?: string | null): { video: string; audio: string } {
  if (!codecString) {
    return { video: 'unknown', audio: 'unknown' };
  }

  const [video, audio] = codecString
    .split(',')
    .map((part) => part?.trim() || 'unknown');

  return {
    video: video ?? 'unknown',
    audio: audio ?? 'unknown',
  };
}

function inferExtensionFromMime(mime?: string | null): string {
  if (!mime) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('ogg')) return 'ogg';
  return 'mp4';
}
