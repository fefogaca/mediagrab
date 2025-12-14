/**
 * TikTok Extractor usando API não oficial
 * Endpoint: https://www.tiktok.com/api/post/item_list/
 */

import axios, { AxiosInstance } from 'axios';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';

interface TikTokApiResponse {
  itemInfo?: {
    itemStruct?: {
      video?: {
        playAddr?: string;
        downloadAddr?: string;
        cover?: string;
        duration?: number;
      };
      desc?: string;
      author?: {
        uniqueId?: string;
        nickname?: string;
      };
      stats?: {
        diggCount?: number;
        shareCount?: number;
        commentCount?: number;
        playCount?: number;
      };
    };
  };
}

export class TikTokApiExtractor implements IExtractor {
  readonly name = 'tiktok-api';
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com',
      },
    });
  }

  supports(url: string): boolean {
    return /tiktok\.com/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    return true; // Sempre disponível
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
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

      // Headers específicos do TikTok
      const headers: Record<string, string> = {
        ...this.axiosInstance.defaults.headers,
        ...options?.headers,
      };

      // Tentar diferentes endpoints da API
      const endpoints = [
        `https://www.tiktok.com/api/post/item_list/?aid=1988&app_name=tiktok_web&device_platform=web&device_id=${Date.now()}&item_id=${videoId}`,
        `https://api.tiktokv.com/aweme/v1/play/?video_id=${videoId}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.axiosInstance.get<TikTokApiResponse>(endpoint, {
            headers,
          });

          const itemStruct = response.data?.itemInfo?.itemStruct;
          if (itemStruct?.video) {
            const video = itemStruct.video;
            const videoUrl = video.downloadAddr || video.playAddr;

            if (!videoUrl) {
              continue; // Tentar próximo endpoint
            }

            const formats: ExtractedFormat[] = [{
              format_id: 'tiktok-api',
              ext: 'mp4',
              resolution: 'Padrão',
              quality: null,
              vcodec: 'unknown',
              acodec: 'unknown',
              url: videoUrl,
            }];

            const title = itemStruct.desc || 
                         `${itemStruct.author?.uniqueId || 'TikTok'}'s video`;

            const result: ExtractedMediaInfo = {
              title,
              formats,
              thumbnail: video.cover,
              description: itemStruct.desc,
              duration: video.duration,
            };

            return {
              success: true,
              data: result,
              method: this.name,
              executionTime: Date.now() - startTime,
            };
          }
        } catch (error) {
          // Continuar para próximo endpoint
          continue;
        }
      }

      return {
        success: false,
        error: {
          code: 'NO_VIDEO',
          message: 'Não foi possível encontrar vídeo via API',
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error.message || 'Erro ao extrair via API do TikTok',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private extractVideoId(url: string): string | null {
    // tiktok.com/@username/video/VIDEO_ID
    const videoMatch = url.match(/\/video\/(\d+)/);
    if (videoMatch) return videoMatch[1];

    // tiktok.com/t/VIDEO_ID
    const tMatch = url.match(/\/t\/([^\/\?]+)/);
    if (tMatch) return tMatch[1];

    return null;
  }
}
