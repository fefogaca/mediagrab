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

import { MediaResolverError } from './mediaResolverError';
export { MediaResolverError };
export type { MediaResolverErrorCode } from './mediaResolverError';

const ytDlpWrap = new YTDlpWrap();

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
        const info = await fetchWithYtDlp(url);
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

async function fetchWithYtDlp(url: string): Promise<{ title: string; formats: RawFormat[] }>
{
  const videoInfo = await ytDlpWrap.getVideoInfo(url);
  const { title, formats } = videoInfo;

  // Separar formatos em categorias para priorizar os que já têm vídeo+áudio
  const videoWithAudio: YtDlpFormat[] = [];
  const videoOnly: YtDlpFormat[] = [];
  const audioOnly: YtDlpFormat[] = [];

  formats.forEach((format: YtDlpFormat) => {
    const hasVideo = format.vcodec && format.vcodec !== 'none';
    const hasAudio = format.acodec && format.acodec !== 'none';
    
    if (hasVideo && hasAudio) {
      videoWithAudio.push(format);
    } else if (hasVideo) {
      videoOnly.push(format);
    } else if (hasAudio) {
      audioOnly.push(format);
    }
  });

  // Priorizar formatos que já têm vídeo+áudio (mais rápido, sem merge)
  // Ordenar por resolução (maior primeiro) para formatos com vídeo+áudio
  const sortedVideoWithAudio = videoWithAudio.sort((a, b) => {
    const aRes = parseInt((a.resolution || '').replace(/\D/g, '')) || 0;
    const bRes = parseInt((b.resolution || '').replace(/\D/g, '')) || 0;
    return bRes - aRes;
  });

  // Combinar: formatos com vídeo+áudio primeiro, depois vídeo-only e áudio-only
  const formatsToProcess = [
    ...sortedVideoWithAudio,
    ...videoOnly,
    ...audioOnly,
  ];

  const processedFormats = formatsToProcess
    .filter((format: YtDlpFormat) => format.format_id || format.format)
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
