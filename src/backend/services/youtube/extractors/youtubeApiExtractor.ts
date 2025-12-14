/**
 * YouTube Extractor usando YouTube Data API v3
 * Requer API Key configurada no admin panel
 */

import { google } from 'googleapis';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';
import Settings from '../../../models/Settings';

export class YouTubeApiExtractor implements IExtractor {
  readonly name = 'youtube-api';

  supports(url: string): boolean {
    return /(youtube\.com\/watch|youtu\.be)/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      return !!apiKey;
    } catch {
      return false;
    }
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: {
            code: 'API_KEY_NOT_CONFIGURED',
            message: 'YouTube API Key não configurada no admin panel',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Extrair video ID da URL
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        return {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Não foi possível extrair o ID do vídeo da URL',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Criar cliente da API
      const youtube = google.youtube({
        version: 'v3',
        auth: apiKey,
      });

      // Buscar informações do vídeo
      const response = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video) {
        return {
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Vídeo não encontrado',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const title = video.snippet?.title || 'Título não disponível';
      const thumbnail = video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url;
      const description = video.snippet?.description;

      // A API do YouTube não retorna URLs de stream diretamente
      // Precisamos construir formatos baseados nas informações disponíveis
      // Na prática, este extractor serve mais para validação e metadados
      // O streaming real ainda precisa ser feito via yt-dlp ou scraping
      const formats: ExtractedFormat[] = [
        {
          format_id: 'api-default',
          ext: 'mp4',
          resolution: 'Padrão',
          quality: 'Padrão',
          vcodec: 'unknown',
          acodec: 'unknown',
        },
      ];

      const result: ExtractedMediaInfo = {
        title,
        formats,
        thumbnail: thumbnail || undefined,
        description,
      };

      // Nota: Este extractor não retorna URLs diretas de stream
      // É útil para validação e metadados, mas não para download direto
      // Por isso, vamos marcar como sucesso mas sem formatos válidos para download
      return {
        success: false, // Marcamos como falha porque não podemos fazer download direto
        error: {
          code: 'NO_DIRECT_STREAM',
          message: 'YouTube Data API não fornece URLs de stream diretas. Use yt-dlp ou scraping.',
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      // Tratar erros específicos da API
      if (error.response?.status === 403) {
        return {
          success: false,
          error: {
            code: 'API_QUOTA_EXCEEDED',
            message: 'Cota da API do YouTube excedida',
            details: error,
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      if (error.response?.status === 404) {
        return {
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Vídeo não encontrado',
            details: error,
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error.message || 'Erro ao extrair informações via YouTube Data API',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private extractVideoId(url: string): string | null {
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];

    // youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];

    // youtube.com/embed/VIDEO_ID
    const embedMatch = url.match(/\/embed\/([^?]+)/);
    if (embedMatch) return embedMatch[1];

    return null;
  }

  private async getApiKey(): Promise<string | null> {
    try {
      // Prioridade: Variável de ambiente > Configurações do banco
      if (process.env.YOUTUBE_API_KEY) {
        return process.env.YOUTUBE_API_KEY;
      }

      const settings = await Settings.getSettings();
      
      // Buscar API key nas configurações (pode ser armazenada em settings.youtubeApiKey ou similar)
      // Por enquanto, vamos buscar em uma propriedade customizada
      const customSettings = settings as any;
      return customSettings.youtubeApiKey || null;
    } catch (error) {
      console.error('[YouTubeApiExtractor] Erro ao obter API key:', error);
      return process.env.YOUTUBE_API_KEY || null;
    }
  }
}
