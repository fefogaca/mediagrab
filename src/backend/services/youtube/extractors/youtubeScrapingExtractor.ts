/**
 * YouTube Extractor usando scraping HTML
 * Extrai ytInitialPlayerResponse do HTML da página
 */

import * as cheerio from 'cheerio';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';

interface YouTubePlayerResponse {
  videoDetails?: {
    title?: string;
    videoId?: string;
    lengthSeconds?: string;
    shortDescription?: string;
    thumbnail?: {
      thumbnails?: Array<{ url?: string }>;
    };
  };
  streamingData?: {
    formats?: Array<{
      itag?: number;
      url?: string;
      mimeType?: string;
      qualityLabel?: string;
      width?: number;
      height?: number;
      bitrate?: number;
      contentLength?: string;
    }>;
    adaptiveFormats?: Array<{
      itag?: number;
      url?: string;
      mimeType?: string;
      qualityLabel?: string;
      width?: number;
      height?: number;
      bitrate?: number;
      contentLength?: string;
      audioChannels?: number;
    }>;
  };
}

export class YouTubeScrapingExtractor implements IExtractor {
  readonly name = 'youtube-scraping';

  supports(url: string): boolean {
    return /(youtube\.com|youtu\.be)/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    return true; // Sempre disponível (apenas faz requisições HTTP)
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Normalizar URL
      let normalizedUrl = url;
      if (url.includes('youtu.be/')) {
        const videoId = url.match(/youtu\.be\/([^?]+)/)?.[1];
        if (videoId) {
          normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }
      }

      // Headers para parecer um navegador
      const headers: Record<string, string> = {
        'User-Agent': options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options?.headers,
      };

      // Fazer requisição HTTP
      const response = await fetch(normalizedUrl, { headers });
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Tentar extrair ytInitialPlayerResponse de diferentes lugares
      let playerResponse: YouTubePlayerResponse | null = null;

      // Método 1: Extrair de <script> tags
      const scripts = $('script').toArray();
      for (const script of scripts) {
        const scriptText = $(script).html() || '';
        
        // Procurar por ytInitialPlayerResponse
        const match = scriptText.match(/var ytInitialPlayerResponse = ({.+?});/);
        if (match) {
          try {
            playerResponse = JSON.parse(match[1]);
            break;
          } catch (e) {
            // Continuar procurando
          }
        }

        // Procurar em window["ytInitialPlayerResponse"]
        const match2 = scriptText.match(/window\["ytInitialPlayerResponse"\]\s*=\s*({.+?});/);
        if (match2) {
          try {
            playerResponse = JSON.parse(match2[1]);
            break;
          } catch (e) {
            // Continuar procurando
          }
        }
      }

      if (!playerResponse) {
        return {
          success: false,
          error: {
            code: 'PLAYER_RESPONSE_NOT_FOUND',
            message: 'Não foi possível extrair ytInitialPlayerResponse do HTML',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Extrair informações do vídeo
      const videoDetails = playerResponse.videoDetails;
      const streamingData = playerResponse.streamingData;

      if (!videoDetails) {
        return {
          success: false,
          error: {
            code: 'VIDEO_DETAILS_NOT_FOUND',
            message: 'Informações do vídeo não encontradas',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const title = videoDetails.title || 'Título não disponível';
      const thumbnail = videoDetails.thumbnail?.thumbnails?.[0]?.url;
      const description = videoDetails.shortDescription;
      const duration = videoDetails.lengthSeconds ? parseInt(videoDetails.lengthSeconds, 10) : undefined;

      // Processar formatos
      const formats: ExtractedFormat[] = [];

      // Formatos regulares
      if (streamingData?.formats) {
        for (const format of streamingData.formats) {
          if (!format.url) continue;

          const formatInfo: ExtractedFormat = {
            format_id: String(format.itag || 'unknown'),
            ext: this.inferExtensionFromMime(format.mimeType),
            resolution: format.qualityLabel || `${format.width}x${format.height}` || 'Desconhecido',
            quality: format.qualityLabel || null,
            vcodec: this.extractVideoCodec(format.mimeType),
            acodec: this.extractAudioCodec(format.mimeType),
            filesize_approx: format.contentLength ? parseInt(format.contentLength, 10) : undefined,
            url: format.url,
          };

          formats.push(formatInfo);
        }
      }

      // Formatos adaptativos (vídeo-only e áudio-only)
      if (streamingData?.adaptiveFormats) {
        for (const format of streamingData.adaptiveFormats) {
          if (!format.url) continue;

          const hasVideo = format.width && format.height;
          const hasAudio = format.audioChannels !== undefined;

          const formatInfo: ExtractedFormat = {
            format_id: String(format.itag || 'unknown'),
            ext: this.inferExtensionFromMime(format.mimeType),
            resolution: hasVideo
              ? (format.qualityLabel || `${format.width}x${format.height}`)
              : (hasAudio ? 'Áudio' : 'Desconhecido'),
            quality: format.qualityLabel || null,
            vcodec: hasVideo ? this.extractVideoCodec(format.mimeType) : 'none',
            acodec: hasAudio ? this.extractAudioCodec(format.mimeType) : 'none',
            filesize_approx: format.contentLength ? parseInt(format.contentLength, 10) : undefined,
            url: format.url,
          };

          formats.push(formatInfo);
        }
      }

      if (formats.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_FORMATS',
            message: 'Nenhum formato de stream encontrado',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const result: ExtractedMediaInfo = {
        title,
        formats,
        thumbnail,
        description,
        duration,
      };

      return {
        success: true,
        data: result,
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao fazer scraping do YouTube',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private inferExtensionFromMime(mimeType?: string): string {
    if (!mimeType) return 'mp4';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('mp3')) return 'mp3';
    if (mimeType.includes('m4a')) return 'm4a';
    return 'mp4';
  }

  private extractVideoCodec(mimeType?: string): string {
    if (!mimeType) return 'unknown';
    const codecMatch = mimeType.match(/codecs="([^"]+)"/);
    if (codecMatch) {
      const codecs = codecMatch[1].split(',');
      const videoCodec = codecs.find(c => c.includes('avc') || c.includes('vp9') || c.includes('av01') || c.includes('vp8'));
      return videoCodec?.trim() || 'unknown';
    }
    return 'unknown';
  }

  private extractAudioCodec(mimeType?: string): string {
    if (!mimeType) return 'unknown';
    const codecMatch = mimeType.match(/codecs="([^"]+)"/);
    if (codecMatch) {
      const codecs = codecMatch[1].split(',');
      const audioCodec = codecs.find(c => c.includes('mp4a') || c.includes('opus') || c.includes('vorbis') || c.includes('mp3'));
      return audioCodec?.trim() || 'unknown';
    }
    return 'unknown';
  }
}
