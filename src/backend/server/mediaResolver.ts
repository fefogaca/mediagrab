import YTDlpWrap from 'yt-dlp-wrap';
import ytdlCore from 'ytdl-core';
import * as distubeYtdl from '@distube/ytdl-core';
import playDl from 'play-dl';
import type { videoFormat } from 'ytdl-core';

import {
  detectMediaProvider,
  type MediaProvider,
  type MediaProviderId,
} from '../media/providers';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type MediaLibrarySource = 
  | 'yt-dlp' 
  | 'ytdl-core' 
  | '@distube/ytdl-core' 
  | 'play-dl';

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

// ============================================
// INSTÂNCIAS DOS PROVIDERS
// ============================================

const ytDlpWrap = new YTDlpWrap();

// ============================================
// INTERFACE COMUM PARA FORMATOS RAW
// ============================================

interface RawFormat {
  format_id: string;
  ext: string;
  resolution: string;
  quality?: string | null;
  vcodec: string;
  acodec: string;
  filesize_approx?: number;
}

interface ProviderResult {
  title: string;
  formats: RawFormat[];
}

// ============================================
// CONFIGURAÇÃO DE FALLBACK POR PLATAFORMA
// ============================================

type ProviderFunction = (url: string, providerId: MediaProviderId) => Promise<ProviderResult | null>;

interface ProviderConfig {
  name: MediaLibrarySource;
  fn: ProviderFunction;
  supportedProviders: MediaProviderId[] | 'all';
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: 'yt-dlp',
    fn: fetchWithYtDlp,
    supportedProviders: 'all', // Suporta 1000+ sites
  },
  {
    name: '@distube/ytdl-core',
    fn: fetchWithDistube,
    supportedProviders: ['youtube'], // Apenas YouTube
  },
  {
    name: 'ytdl-core',
    fn: fetchWithYtdl,
    supportedProviders: ['youtube'], // Apenas YouTube
  },
  {
    name: 'play-dl',
    fn: fetchWithPlayDl,
    supportedProviders: ['youtube', 'soundcloud'], // YouTube e SoundCloud
  },
];

// ============================================
// FUNÇÃO PRINCIPAL COM FALLBACK
// ============================================

export async function resolveMediaInfo(url: string): Promise<ResolvedMediaInfo> {
  const provider = detectMediaProvider(url);
  if (!provider) {
    throw new MediaResolverError(
      'UNSUPPORTED_PROVIDER',
      'Este link não é suportado para download.',
    );
  }

  // Filtrar providers que suportam esta plataforma
  const availableProviders = PROVIDERS.filter(p => 
    p.supportedProviders === 'all' || p.supportedProviders.includes(provider.id)
  );

  const errors: Partial<Record<MediaLibrarySource, unknown>> = {};

  // Tentar cada provider em sequência
  for (const providerConfig of availableProviders) {
    try {
      console.log(`[MediaResolver] Tentando ${providerConfig.name}...`);
      
      const info = await providerConfig.fn(url, provider.id);
      
      if (info && info.formats.length > 0) {
        console.log(`[MediaResolver] ✅ Sucesso com ${providerConfig.name}`);
        return {
          title: info.title,
          provider,
          library: providerConfig.name,
          formats: info.formats.map((format) => ({ ...format, source: providerConfig.name })),
        };
      }
    } catch (error) {
      console.warn(`[MediaResolver] ❌ ${providerConfig.name} falhou:`, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
      errors[providerConfig.name] = error;
    }
  }

  // Se todos falharam, lançar erro
  const firstError = Object.values(errors)[0] || new Error('Nenhum provider disponível');

  throw new MediaResolverError(
    'RESOLUTION_FAILED',
    'Não foi possível preparar este download. Todos os providers falharam. Tente novamente em instantes.',
    firstError,
  );
}

// ============================================
// PROVIDER: YT-DLP (Principal - 1000+ sites)
// ============================================

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

async function fetchWithYtDlp(url: string): Promise<ProviderResult> {
  const videoInfo = await ytDlpWrap.getVideoInfo(url);
  const { title, formats } = videoInfo;

  // Separar formatos em categorias
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

  // Priorizar: vídeo+áudio > vídeo-only (para merge) > áudio-only
  // Se não houver vídeo+áudio, usar vídeo-only (o backend vai fazer merge com áudio)
  const formatsToUse = videoWithAudio.length > 0 
    ? [...videoWithAudio, ...audioOnly]
    : [...videoOnly, ...audioOnly];

  const processedFormats = formatsToUse
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

// ============================================
// PROVIDER: @distube/ytdl-core (YouTube - Fork ativo)
// ============================================

async function fetchWithDistube(
  url: string,
  providerId: MediaProviderId,
): Promise<ProviderResult | null> {
  if (providerId !== 'youtube') {
    return null;
  }

  const info = await distubeYtdl.getInfo(url);
  const formats = info.formats
    .filter((format) => format.hasVideo || format.hasAudio)
    .map((format): RawFormat => {
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

// ============================================
// PROVIDER: ytdl-core (YouTube - Original)
// ============================================

async function fetchWithYtdl(
  url: string,
  providerId: MediaProviderId,
): Promise<ProviderResult | null> {
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

// ============================================
// PROVIDER: play-dl (YouTube, SoundCloud, Spotify)
// ============================================

async function fetchWithPlayDl(
  url: string,
  providerId: MediaProviderId,
): Promise<ProviderResult | null> {
  if (providerId !== 'youtube' && providerId !== 'soundcloud') {
    return null;
  }

  if (providerId === 'youtube') {
    const info = await playDl.video_info(url);
    const videoInfo = info.video_details;
    
    // play-dl retorna formatos de forma diferente
    const formats: RawFormat[] = [];
    
    // Adicionar formato de vídeo padrão
    if (videoInfo.title) {
      // Play-dl não retorna formatos detalhados como yt-dlp
      // Então criamos formatos genéricos baseados nas qualidades comuns
      const qualities = ['1080p', '720p', '480p', '360p', '240p', '144p'];
      
      for (const quality of qualities) {
        formats.push({
          format_id: `play-dl-${quality}`,
          ext: 'mp4',
          resolution: quality,
          quality: quality,
          vcodec: 'avc1',
          acodec: 'mp4a',
          filesize_approx: undefined,
        });
      }
      
      // Adicionar formato de áudio
      formats.push({
        format_id: 'play-dl-audio',
        ext: 'm4a',
        resolution: 'Áudio',
        quality: '128kbps',
        vcodec: 'none',
        acodec: 'mp4a',
        filesize_approx: undefined,
      });
    }

    return {
      title: videoInfo.title || 'Título não disponível',
      formats,
    };
  }

  if (providerId === 'soundcloud') {
    const info = await playDl.soundcloud(url);
    
    if ('name' in info) {
      // É uma track
      return {
        title: info.name || 'Áudio SoundCloud',
        formats: [{
          format_id: 'soundcloud-audio',
          ext: 'mp3',
          resolution: 'Áudio',
          quality: '128kbps',
          vcodec: 'none',
          acodec: 'mp3',
          filesize_approx: undefined,
        }],
      };
    }
  }

  return null;
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

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

// ============================================
// EXPORTAR LISTA DE PROVIDERS DISPONÍVEIS
// ============================================

export function getAvailableProviders(): { name: MediaLibrarySource; platforms: string }[] {
  return PROVIDERS.map(p => ({
    name: p.name,
    platforms: p.supportedProviders === 'all' 
      ? 'Todos (1000+ sites)' 
      : p.supportedProviders.join(', '),
  }));
}
