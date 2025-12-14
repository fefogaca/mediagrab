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
  url?: string; // URL direta do stream (quando disponível, ex: Twitter scraping)
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

  // Para YouTube, usar o novo orquestrador com fallback em paralelo
  if (provider.id === 'youtube') {
    try {
      const { resolveYouTubeMedia } = await import('../services/youtube/youtubeOrchestrator');
      const { convertToResolvedMediaInfo } = await import('../services/common/adapters');
      
      const result = await resolveYouTubeMedia(url);
      
      if (result.success && result.data) {
        console.log(`[MediaResolver] ✅ Sucesso com novo orquestrador YouTube (método: ${result.method})`);
        return convertToResolvedMediaInfo(result, provider) as ResolvedMediaInfo;
      }
      
      // Se falhou, continuar com métodos antigos
      console.warn(`[MediaResolver] Novo orquestrador YouTube falhou, tentando métodos antigos...`);
    } catch (error) {
      console.warn(`[MediaResolver] Erro no novo orquestrador YouTube, usando métodos antigos:`, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
      // Continuar com métodos antigos
    }
  }

  // Para Twitter, usar o novo orquestrador
  if (provider.id === 'twitter') {
    try {
      const { resolveTwitterMedia } = await import('../services/twitter/twitterOrchestrator');
      const { convertToResolvedMediaInfo } = await import('../services/common/adapters');
      
      const result = await resolveTwitterMedia(url);
      
      if (result.success && result.data) {
        console.log(`[MediaResolver] ✅ Sucesso com novo orquestrador Twitter (método: ${result.method})`);
        return convertToResolvedMediaInfo(result, provider) as ResolvedMediaInfo;
      }
      
      // Se falhou, continuar com métodos antigos (yt-dlp)
      console.warn(`[MediaResolver] Novo orquestrador Twitter falhou, tentando métodos antigos...`);
    } catch (error) {
      console.warn(`[MediaResolver] Erro no novo orquestrador Twitter, usando métodos antigos:`, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
      // Continuar com métodos antigos
    }
  }

  // Para Instagram, usar o novo orquestrador
  if (provider.id === 'instagram') {
    try {
      const { resolveInstagramMedia } = await import('../services/instagram/instagramOrchestrator');
      const { convertToResolvedMediaInfo } = await import('../services/common/adapters');
      
      const result = await resolveInstagramMedia(url);
      
      if (result.success && result.data) {
        console.log(`[MediaResolver] ✅ Sucesso com novo orquestrador Instagram (método: ${result.method})`);
        return convertToResolvedMediaInfo(result, provider) as ResolvedMediaInfo;
      }
      
      // Se falhou, continuar com métodos antigos (yt-dlp)
      console.warn(`[MediaResolver] Novo orquestrador Instagram falhou, tentando métodos antigos...`);
    } catch (error) {
      console.warn(`[MediaResolver] Erro no novo orquestrador Instagram, usando métodos antigos:`, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
      // Continuar com métodos antigos
    }
  }

  // Para TikTok, usar o novo orquestrador
  if (provider.id === 'tiktok') {
    try {
      const { resolveTikTokMedia } = await import('../services/tiktok/tiktokOrchestrator');
      const { convertToResolvedMediaInfo } = await import('../services/common/adapters');
      
      const result = await resolveTikTokMedia(url);
      
      if (result.success && result.data) {
        console.log(`[MediaResolver] ✅ Sucesso com novo orquestrador TikTok (método: ${result.method})`);
        return convertToResolvedMediaInfo(result, provider) as ResolvedMediaInfo;
      }
      
      // Se falhou, continuar com métodos antigos (yt-dlp)
      console.warn(`[MediaResolver] Novo orquestrador TikTok falhou, tentando métodos antigos...`);
    } catch (error) {
      console.warn(`[MediaResolver] Erro no novo orquestrador TikTok, usando métodos antigos:`, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
      // Continuar com métodos antigos
    }
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

async function fetchWithYtDlp(url: string, providerId?: string): Promise<ProviderResult> {
  // Detectar plataforma para usar cookies apropriados
  const isInstagram = url.includes('instagram.com') || url.includes('instagr.am');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isTwitter = url.includes('twitter.com') || url.includes('x.com');
  
  // Obter cookies se disponíveis
  let cookiesPath: string | null = null;
  if (isInstagram || isYouTube) {
    try {
      const { getCookiesFilePath } = await import('@/backend/lib/cookies');
      const platform = isInstagram ? 'instagram' : 'youtube';
      cookiesPath = await getCookiesFilePath(platform);
    } catch (error) {
      console.warn('Erro ao obter cookies:', error);
    }
  }

  // Preparar argumentos do yt-dlp
  // getVideoInfo aceita um array de strings como argumentos
  const args: string[] = [url];
  if (cookiesPath) {
    args.push('--cookies', cookiesPath);
  }

  const videoInfo = await ytDlpWrap.getVideoInfo(args);
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

  // Para Twitter/X e Instagram: formatos HLS/DASH geralmente são apenas vídeo, precisam de merge
  // Incluir formatos de áudio separados se existirem
  
  // Para Instagram: filtrar formatos VP9/AV1 que causam vídeo preto, priorizar H.264 (avc1)
  if (isInstagram) {
    // Filtrar formatos com codec problemático (VP9, AV1)
    const filteredVideoWithAudio = videoWithAudio.filter(f => 
      !f.vcodec?.includes('vp9') && !f.vcodec?.includes('av01') && !f.vcodec?.includes('vp09')
    );
    const filteredVideoOnly = videoOnly.filter(f => 
      !f.vcodec?.includes('vp9') && !f.vcodec?.includes('av01') && !f.vcodec?.includes('vp09')
    );
    
    // Priorizar formatos H.264 (avc1)
    const h264Formats = [...filteredVideoWithAudio, ...filteredVideoOnly].filter(f => 
      f.vcodec?.toLowerCase().includes('avc1') || f.vcodec?.toLowerCase().includes('h264')
    );
    const otherFormats = [...filteredVideoWithAudio, ...filteredVideoOnly].filter(f => 
      !f.vcodec?.toLowerCase().includes('avc1') && !f.vcodec?.toLowerCase().includes('h264')
    );
    
    // Usar H.264 primeiro, depois outros formatos (serão re-encodados)
    const formatsToUse = h264Formats.length > 0 
      ? [...h264Formats, ...otherFormats, ...audioOnly]
      : [...filteredVideoWithAudio, ...filteredVideoOnly, ...audioOnly];
    
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
  
  // Priorizar: vídeo+áudio > vídeo-only (para merge) > áudio-only
  // Se não houver vídeo+áudio, usar vídeo-only (o backend vai fazer merge com áudio)
  // Para Twitter e Instagram, sempre incluir áudio-only para permitir merge
  const formatsToUse = videoWithAudio.length > 0 
    ? [...videoWithAudio, ...((isTwitter || isInstagram) ? audioOnly : []), ...audioOnly]
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
